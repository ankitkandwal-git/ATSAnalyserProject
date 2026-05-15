
import { extractTextFromPDF } from "../utils/resumeParser.js";
import Resume from "../models/resume.js";
import { analyzeResume } from "../utils/aiAnalyser.js";
export const uploadResume = async (req, res) => {
    // Check if file exists
    if (!req.file) {
        return res.status(400).json({
            message: "No file uploaded"
        });
    }

    try {
        const extractedText = await extractTextFromPDF(req.file.path);
        const resume = new Resume({
            userId: null,
            filename: req.file.originalname,
            path: req.file.path
        });

        await resume.save();
        res.status(200).json({
            message: "Resume uploaded successfully",
            extractedText
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Error processing resume"
        });
    }
};

export const analyzeResumeController = async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;
        if (!resumeText) {
            return res.status(400).json({
                error: 'Resume text is required'
            });
        }
        const analysisResult = await analyzeResume(
            resumeText,
            jobDescription || ""
        );

        res.json({
            success: true,
            analysis: analysisResult.parsed,
            rawText: analysisResult.parsed ? undefined : analysisResult.rawText,
            model: analysisResult.model
        });

    } catch (err) {
        console.error("analyzeResumeController error:", err);
        const status = String(err?.message || "").includes("[GoogleGenerativeAI Error]")
            ? 502
            : 500;
        res.status(status).json({
            success: false,
            error: err?.message || "Internal Server Error",
            ...(process.env.NODE_ENV !== "production" ? { stack: err?.stack } : {})
        });
    }
};