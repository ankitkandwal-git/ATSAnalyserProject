import { Worker } from "bullmq";
import { analyzeResume } from "../utils/aiAnalyser.js";
import bullmqRedisConnection from "../config/bullmq.js";

const resumeWorker = new Worker(
    "resume-analysis",
    async (job) => {
        const { resumeText, jobDescription } = job.data || {};

        console.log(`Job ${job.id} started`);

        const analysisResult = await analyzeResume(resumeText, jobDescription);

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
    } else {
        console.error("Resume worker failed with error:", err);
    }
});

export default resumeWorker;