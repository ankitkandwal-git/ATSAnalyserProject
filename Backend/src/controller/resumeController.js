import fs from "fs";
import { extractTextFromPDF } from "../utils/resumeParser.js";
import Resume from "../models/resume.js";
import { resumeQueue } from "../queues/resumeQueue.js";
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
        const { resumeText, jobDescription } = req.body || {};

        if (!resumeText || !resumeText.trim()) {
            return res.status(400).json({
                success: false,
                error: "Resume text is required",
            });
        }

        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({
                success: false,
                error: "Job description is required",
            });
        }

        const job = await resumeQueue.add("resume-analysis", {
            resumeText,
            jobDescription,
        });

        return res.status(202).json({
            success: true,
            message: "Resume analysis queued successfully",
            jobId: job.id,
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