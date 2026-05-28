import fs from "fs";
import { extractTextFromPDF } from "../utils/resumeParser.js";
import Resume from "../models/resume.js";
import { analyzeResume } from "../utils/aiAnalyser.js";

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

    const startTime = Date.now();

    console.log(
        "[resume-analyze] ===== START ANALYSIS ====="
    );

    try {
        const { resumeText, jobDescription } = req.body || {};

        if (!resumeText || !resumeText.trim()) {

            return res.status(400).json({
                success: false,
                error: "Resume text is required",
            });
        }


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