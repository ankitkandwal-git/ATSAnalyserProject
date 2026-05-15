import { extractTextFromPDF } from "../utils/resumeParser.js";
import Resume from "../models/resume.js";
import { analyzeResume } from "../utils/aiAnalyser.js";

const cleanupUploadedFile = async (filePath) => {
    if (!filePath) {
        return;
    }

    try {
        const { unlink } = await import('fs/promises');
        await unlink(filePath);
        console.log(`[resume-upload] cleaned up uploaded file: ${filePath}`);
    } catch (error) {
        console.warn(`[resume-upload] failed to clean up uploaded file: ${filePath}`, error.message);
    }
};

export const uploadResume = async (req, res) => {
    // Check if file exists
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded'
        });
    }

    try {
        console.log('[resume-upload] incoming file', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        const extractedText = await extractTextFromPDF(req.file.path);

        if (!extractedText || !extractedText.trim()) {
            return res.status(422).json({
                success: false,
                error: 'Uploaded resume did not contain any extractable text'
            });
        }

        console.log('[resume-upload] parsed text length', extractedText.length);

        const resume = new Resume({
            userId: null,
            filename: req.file.originalname,
            path: req.file.path
        });

        await resume.save();
        res.status(200).json({
            success: true,
            message: 'Resume uploaded successfully',
            extractedText,
            resumeId: resume._id
        });

    } catch (err) {
        console.error('[resume-upload] error processing resume:', err);

        const message = String(err?.message || 'Error processing resume');
        const status = message.includes('Unsupported file type') ? 400 : 500;

        res.status(status).json({
            success: false,
            error: message
        });
    } finally {
        await cleanupUploadedFile(req.file?.path);
    }
};

export const analyzeResumeController = async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body || {};
        const cleanResumeText = String(resumeText || '').trim();

        console.log('[resume-analyze] request received', {
            resumeTextLength: cleanResumeText.length,
            jobDescriptionLength: String(jobDescription || '').trim().length
        });

        if (!cleanResumeText) {
            return res.status(400).json({
                success: false,
                error: 'Resume text is required'
            });
        }

        const analysisResult = await analyzeResume(
            cleanResumeText,
            jobDescription || ""
        );

        console.log('[resume-analyze] analysis completed', {
            model: analysisResult.model,
            fallbackUsed: analysisResult.fallbackUsed,
            parsed: Boolean(analysisResult.parsed)
        });

        res.json({
            success: true,
            analysis: analysisResult.parsed,
            rawText: analysisResult.fallbackUsed ? analysisResult.rawText : undefined,
            model: analysisResult.model,
            fallbackUsed: analysisResult.fallbackUsed || false
        });

    } catch (err) {
        console.error('[resume-analyze] controller error:', err);

        const status = err?.statusCode || (
            String(err?.message || '').includes('timed out')
                ? 504
                : String(err?.message || '').includes('[GoogleGenerativeAI Error]')
                    ? 502
                    : 500
        );

        res.status(status).json({
            success: false,
            error: err?.message || 'Resume analysis failed',
            ...(process.env.NODE_ENV !== 'production' ? { stack: err?.stack } : {})
        });
    }
};