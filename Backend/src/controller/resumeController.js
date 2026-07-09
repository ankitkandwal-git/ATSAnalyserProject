import fs from "fs";
import crypto from "crypto";
import { extractTextFromPDF } from "../utils/resumeParser.js";
import Resume from "../models/resume.js";
import { resumeQueue } from "../queues/resumeQueue.js";
import redisClient from "../config/redis.js";

const buildAnalysisJobId = (resumeText, jobDescription = "") => {
    const normalizedResumeText = resumeText.trim().replace(/\s+/g, " ");
    const normalizedJobDescription = jobDescription.trim().replace(/\s+/g, " ");

    return crypto
        .createHash("sha256")
        .update(`${normalizedResumeText}::${normalizedJobDescription}`)
        .digest("hex");
};

const buildAnalysisCacheKey = (analysisHash) => `resume:analysis:${analysisHash}`;
const buildAnalysisWaitersKey = (analysisHash) => `resume:analysis:waiters:${analysisHash}`;

const buildAnalysisHash = (resumeText, jobDescription = "") => {
    const normalizedResumeText = resumeText.trim().replace(/\s+/g, " ");
    const normalizedJobDescription = jobDescription.trim().replace(/\s+/g, " ");

    return crypto
        .createHash("sha256")
        .update(`${normalizedResumeText}::${normalizedJobDescription}`)
        .digest("hex");
};

const getCachedAnalysis = async (analysisHash) => {
    const cachedAnalysis = await redisClient.get(buildAnalysisCacheKey(analysisHash));

    if (!cachedAnalysis) {
        return null;
    }

    return JSON.parse(cachedAnalysis);
};

const registerAnalysisWaiter = async (resumeId, analysisHash) => {
    if (!resumeId) {
        return;
    }

    await redisClient.sAdd(buildAnalysisWaitersKey(analysisHash), String(resumeId));
};

const saveAnalysisToResume = async ({
    resumeId,
    analysisHash,
    analysisJobId,
    analysisStatus,
    analysisResult,
    analysisError,
}) => {
    if (!resumeId) {
        return;
    }

    await Resume.findByIdAndUpdate(resumeId, {
        analysisHash,
        analysisJobId,
        analysisStatus,
        analysisResult,
        analysisError,
        analysisCompletedAt: analysisStatus === "completed" ? new Date() : undefined,
    });
};

export const uploadResume = async (req, res) => {

    console.log("[resume-upload] ===== START UPLOAD =====");

    try {
        if (!req.file) {

            console.warn("[resume-upload] No file uploaded");

            return res.status(400).json({
                success: false,
                error: "No file uploaded",
            });
        }

        console.log("[resume-upload] File received:", {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
        });

        console.log(
            "[resume-upload] FILE EXISTS:",
            fs.existsSync(req.file.path)
        );

        console.log("[resume-upload] Extracting PDF text...");
        console.log("FILE PATH:", req.file.path);
        const extractedText = await extractTextFromPDF(req.file.path);
        console.log("EXTRACTED TEXT:", extractedText);
        if (!extractedText || !extractedText.trim()) {

            console.warn("[resume-upload] No readable text found");

            return res.status(422).json({
                success: false,
                error: "No readable text found in PDF",
            });
        }

        console.log(
            "[resume-upload] Text extracted successfully"
        );

        const newResume = new Resume({
            userId: null,
            filename: req.file.originalname,
            resumeUrl: req.file.path,
            extractedText,
        });

        const savedResume = await newResume.save();

        console.log(
            "[resume-upload] Resume saved:",
            savedResume._id
        );

        return res.status(200).json({
            success: true,
            message: "Resume uploaded successfully",
            extractedText,
            resumeId: savedResume._id,
        });

    } catch (error) {

        console.error("[resume-upload] Server Error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Upload failed",
        });
    }
};

export const analyzeResumeController = async (req, res) => {
    console.log("[resume-analyze] ===== START ANALYSIS =====");

    try {
        const { resumeText, jobDescription, resumeId } = req.body || {};

        if (!resumeText || !resumeText.trim()) {
            return res.status(400).json({
                success: false,
                error: "Resume text is required",
            });
        }

        const analysisHash = buildAnalysisHash(resumeText, jobDescription || "");
        const cachedAnalysis = await getCachedAnalysis(analysisHash);

        if (cachedAnalysis) {
            await saveAnalysisToResume({
                resumeId,
                analysisHash,
                analysisStatus: "completed",
                analysisResult: cachedAnalysis,
            });

            return res.status(200).json({
                success: true,
                cached: true,
                message: "Resume analysis loaded from cache",
                result: cachedAnalysis,
                analysisHash,
            });
        }

        const jobId = buildAnalysisJobId(resumeText, jobDescription || "");

        const job = await resumeQueue.add("resume-analysis", {
            resumeText,
            jobDescription: jobDescription || "",
            resumeId,
            analysisHash,
        }, {
            jobId,
        });

        await saveAnalysisToResume({
            resumeId,
            analysisHash,
            analysisJobId: job.id,
            analysisStatus: "queued",
        });

        await registerAnalysisWaiter(resumeId, analysisHash);

        return res.status(202).json({
            success: true,
            message: "Resume analysis queued successfully",
            jobId: job.id,
            analysisHash,
        });

    } catch (error) {
        console.error("[resume-analyze] Server Error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Resume analysis failed",
        });
    }
};

export const getResumeJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await resumeQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                error: "Job not found",
            });
        }

        const state = await job.getState();
        const response = {
            success: true,
            jobId: job.id,
            state,
        };

        if (state === "completed") {
            response.result = job.returnvalue;
        }

        if (state === "failed") {
            response.reason = job.failedReason;
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error("[resume-job-status] Server Error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Failed to fetch job status",
        });
    }
};

export const getResumeHistory = async (req, res) => {
    try {
        const resumes = await Resume.find({ analysisResult: { $ne: null } })
            .sort({ analysisCompletedAt: -1, uploadDate: -1 })
            .limit(10)
            .select('filename extractedText analysisResult analysisStatus analysisCompletedAt uploadDate');

        const history = resumes.map((resume) => {
            const analysis = resume.analysisResult || {};

            return {
                id: resume._id,
                fileName: resume.filename,
                timestamp: (resume.analysisCompletedAt || resume.uploadDate || new Date()).toLocaleString(),
                status: analysis.atsScore >= 75 ? 'good' : analysis.atsScore >= 50 ? 'medium' : 'low',
                atsScore: analysis.atsScore || 0,
                improvements: Array.isArray(analysis.improvements) ? analysis.improvements : [],
                analysis,
            };
        });

        return res.status(200).json({
            success: true,
            history,
        });
    } catch (error) {
        console.error('[resume-history] Server Error:', error);

        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch resume history',
        });
    }
};