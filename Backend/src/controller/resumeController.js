import fs from "fs";
import { extractTextFromPDF } from "../utils/resumeParser.js";
import Resume from "../models/resume.js";
import { analyzeResume } from "../utils/aiAnalyser.js";

/*
========================================
UPLOAD RESUME CONTROLLER
========================================
*/

export const uploadResume = async (req, res) => {

    console.log("[resume-upload] ===== START UPLOAD =====");

    try {

        // Validate file exists
        if (!req.file) {

            console.warn("[resume-upload] No file uploaded");

            return res.status(400).json({
                success: false,
                error: "No file uploaded",
            });
        }

        // Log file details
        console.log("[resume-upload] File received:", {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
        });

        // Check file exists
        console.log(
            "[resume-upload] FILE EXISTS:",
            fs.existsSync(req.file.path)
        );

        // Extract text from PDF
        console.log("[resume-upload] Extracting PDF text...");

        const extractedText = await extractTextFromPDF(req.file.path);

        // Validate extracted text
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

        // Save to DB
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

/*
========================================
ANALYZE RESUME CONTROLLER
========================================
*/

export const analyzeResumeController = async (req, res) => {

    const startTime = Date.now();

    console.log(
        "[resume-analyze] ===== START ANALYSIS ====="
    );

    try {

        const { resumeText, jobDescription } = req.body || {};

        // Validate inputs
        if (!resumeText || !resumeText.trim()) {

            return res.status(400).json({
                success: false,
                error: "Resume text is required",
            });
        }

        // AI analysis
        const analysisResult = await analyzeResume(
            resumeText,
            jobDescription
        );

        const totalDuration = Date.now() - startTime;

        console.log(
            "[resume-analyze] Analysis completed"
        );

        return res.status(200).json({
            success: true,
            analysis: analysisResult.parsed,
            rawText: analysisResult.rawText,
            model: analysisResult.model,
            fallbackUsed: analysisResult.fallbackUsed || false,
            duration: totalDuration,
        });

    } catch (error) {

        console.error(
            "[resume-analyze] Server Error:",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                error.message ||
                "Resume analysis failed",
        });
    }
};