import { Worker } from "bullmq";
import { analyzeResume } from "../utils/aiAnalyser.js";
import bullmqRedisConnection from "../config/bullmq.js";
import Resume from "../models/resume.js";
import redisClient from "../config/redis.js";

const buildAnalysisCacheKey = (analysisHash) => `resume:analysis:${analysisHash}`;
const buildAnalysisWaitersKey = (analysisHash) => `resume:analysis:waiters:${analysisHash}`;

const resumeWorker = new Worker(
    "resume-analysis",
    async (job) => {
        const { resumeText, jobDescription, resumeId, analysisHash } = job.data || {};

        console.log(`Job ${job.id} started`);

        if (resumeId) {
            await Resume.findByIdAndUpdate(resumeId, {
                analysisJobId: job.id,
                analysisStatus: "processing",
            });
        }

        const analysisResult = await analyzeResume(resumeText, jobDescription);

        if (analysisHash) {
            await redisClient.set(
                buildAnalysisCacheKey(analysisHash),
                JSON.stringify(analysisResult.parsed)
            );

            const pendingResumeIds = await redisClient.sMembers(buildAnalysisWaitersKey(analysisHash));

            if (pendingResumeIds.length > 0) {
                await Promise.all(
                    pendingResumeIds.map((pendingResumeId) => Resume.findByIdAndUpdate(pendingResumeId, {
                        analysisHash,
                        analysisJobId: job.id,
                        analysisStatus: "completed",
                        analysisResult: analysisResult.parsed,
                        analysisCompletedAt: new Date(),
                        analysisError: null,
                    }))
                );
            }

            await redisClient.del(buildAnalysisWaitersKey(analysisHash));
        }

        if (resumeId) {
            await Resume.findByIdAndUpdate(resumeId, {
                analysisHash,
                analysisJobId: job.id,
                analysisStatus: "completed",
                analysisResult: analysisResult.parsed,
                analysisCompletedAt: new Date(),
                analysisError: null,
            });
        }

        const result = {
            analysis: analysisResult.parsed,
            rawText: analysisResult.rawText,
            model: analysisResult.model,
            fallbackUsed: analysisResult.fallbackUsed || false,
        };

        console.log(`Job ${job.id} completed`);

        return result;
    },
    {
        connection: bullmqRedisConnection,
    }
);

resumeWorker.on("failed", (job, err) => {
    if (job) {
        console.error(`Job ${job.id} failed with error:`, err);

        const { resumeId } = job.data || {};

        if (resumeId) {
            Resume.findByIdAndUpdate(resumeId, {
                analysisStatus: "failed",
                analysisError: err?.message || "Analysis failed",
            }).catch((updateError) => {
                console.error(`Failed to mark resume ${resumeId} as failed:`, updateError);
            });
        }
    } else {
        console.error("Resume worker failed with error:", err);
    }
});

export default resumeWorker;