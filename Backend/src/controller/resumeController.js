import fs from "fs";
import { extractTextFromPDF } from "../utils/resumeParser.js";
import Resume from "../models/resume.js";
import { analyzeResume } from "../utils/aiAnalyser.js";
import redisClient from "../config/redis.js"; 
import crypto from "crypto";
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

    console.log("[resume-analyze] ===== START ANALYSIS =====");

    try {
        const { resumeText, jobDescription } = req.body || {};

        if (!resumeText || !resumeText.trim()) {
            return res.status(400).json({
                success: false,
                error: "Resume text is required",
            });
        }

        // Generate unique cache key
        const cacheKey = crypto
            .createHash("sha256")
            .update(resumeText.trim() + (jobDescription || "").trim())
            .digest("hex");

        const redisKey = `resume_analysis:${cacheKey}`;

        // Check Redis cache
        const cachedResult = await redisClient.get(redisKey);

        if (cachedResult) {
            console.log("🟢 Redis Cache HIT");

            const data = JSON.parse(cachedResult);

            return res.status(200).json({
                success: true,
                ...data,
                cached: true,
                duration: Date.now() - startTime,
            });
        }

        console.log("🔴 Redis Cache MISS");

        // Call Gemini AI
        const analysisResult = await analyzeResume(
            resumeText,
            jobDescription
        );

        const responseData = {
            analysis: analysisResult.parsed,
            rawText: analysisResult.rawText,
            model: analysisResult.model,
            fallbackUsed: analysisResult.fallbackUsed || false,
        };

        // Save in Redis for 1 hour
        await redisClient.set(
            redisKey,
            JSON.stringify(responseData),
            {
                EX: 3600,
            }
        );

        console.log("💾 Saved analysis to Redis");

        // Verify Redis storage (optional, remove later)
        const verify = await redisClient.get(redisKey);
        console.log("Redis Verification:", verify ? "SUCCESS" : "FAILED");

        return res.status(200).json({
            success: true,
            ...responseData,
            cached: false,
            duration: Date.now() - startTime,
        });

    } catch (error) {
        console.error("[resume-analyze] Server Error:", error);

        return res.status(500).json({
            success: false,
            error: error.message || "Resume analysis failed",
        });
    }
};