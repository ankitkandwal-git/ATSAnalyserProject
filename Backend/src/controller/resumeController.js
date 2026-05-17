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
        console.log(`[resume-controller] Cleaned up file: ${filePath}`);
    } catch (error) {
        console.warn(`[resume-controller] Failed to cleanup file ${filePath}:`, error.message);
    }
};


export const uploadResume = async (req, res) => {
    console.log('[resume-upload] ===== START UPLOAD =====');
    let savedResume = null;
    let uploadedFileCleaned = false;

    const cleanupRequestFile = async () => {
        if (uploadedFileCleaned) {
            return;
        }

        uploadedFileCleaned = true;
        await cleanupUploadedFile(req.file?.path);
    };

    try {
        // Validate file exists
        if (!req.file) {
            console.warn('[resume-upload] No file provided');
            return res.status(400).json({
                success: false,
                error: 'No file uploaded. Please select a PDF resume.'
            });
        }

        // Log file details
        console.log('[resume-upload] File received:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        // Validate file type
        if (req.file.mimetype !== 'application/pdf') {
            console.warn('[resume-upload] Invalid file type:', req.file.mimetype);
            await cleanupRequestFile();
            return res.status(400).json({
                success: false,
                error: 'Only PDF files are supported. Received: ' + req.file.mimetype
            });
        }

        // Validate file size
        if (req.file.size === 0) {
            console.warn('[resume-upload] File is empty');
            await cleanupRequestFile();
            return res.status(400).json({
                success: false,
                error: 'Uploaded file is empty'
            });
        }

        // Extract text from PDF
        // Extract text from PDF
console.log('[resume-upload] Extracting text from PDF...');
let extractedText;
try {
    extractedText = await extractTextFromPDF(req.file.path);
} catch (parseError) {
    console.error('[resume-upload] PDF parsing failed:', parseError);
    await cleanupRequestFile();
    return res.status(422).json({
        success: false,
        error: 'Failed to parse PDF: ' + (parseError.message || 'Unknown error')
    });
}

        // Validate extracted text
        if (!extractedText || !extractedText.trim()) {
            console.warn('[resume-upload] No text extracted from PDF');
            await cleanupRequestFile();
            return res.status(422).json({
                success: false,
                error: 'PDF file did not contain any readable text. Try a different resume file.'
            });
        }

        console.log('[resume-upload] Text extracted, length:', extractedText.length);

        // Save resume metadata to database
        try {
            const newResume = new Resume({
                 userId: null,
                filename: req.file.originalname,
                 resumeUrl: req.file.path
            });

            savedResume = await newResume.save();
            console.log('[resume-upload] Resume saved to DB with ID:', savedResume._id);
        } catch (dbError) {
            console.error('[resume-upload] Database save failed:', dbError.message);
            await cleanupRequestFile();
            return res.status(500).json({
                success: false,
                error: 'Failed to save resume to database'
            });
        }

        if (!savedResume?._id) {
            const saveError = new Error('Resume was not saved correctly');
            saveError.statusCode = 500;
            throw saveError;
        }

        console.log('[resume-upload] ===== END UPLOAD (SUCCESS) =====');

        return res.status(200).json({
            success: true,
            message: 'Resume uploaded and parsed successfully',
            extractedText,
            resumeId: savedResume._id,
            fileName: req.file.originalname
        });

    } catch (error) {
        console.error('[resume-upload] Unexpected error:', error);
        await cleanupRequestFile();

        if (res.headersSent) {
            return;
        }

        const statusCode = error?.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            error: error?.message || 'Failed to upload resume',
            ...(process.env.NODE_ENV !== 'production' ? { stack: error?.stack } : {})
        });
    } finally {
        // Cleanup uploaded file after processing
        await cleanupRequestFile();
    }
};

export const analyzeResumeController = async (req, res) => {
    const startTime = Date.now();
    console.log('[resume-analyze] ===== START ANALYSIS REQUEST =====');

    try {
        // Validate request body
        const { resumeText, jobDescription } = req.body || {};

        console.log('[resume-analyze] Request body received:', {
            hasResumeText: Boolean(resumeText),
            resumeTextLength: resumeText?.length || 0,
            hasJobDescription: Boolean(jobDescription),
            jobDescriptionLength: jobDescription?.length || 0
        });

        // Clean and validate inputs
        const cleanResumeText = String(resumeText || '').trim();
        const cleanJobDescription = String(jobDescription || '').trim();

        if (!cleanResumeText || cleanResumeText.length === 0) {
            console.warn('[resume-analyze] No resume text provided');
            return res.status(400).json({
                success: false,
                error: 'Resume text is required. Please upload a resume first.'
            });
        }

        if (cleanResumeText.length < 10) {
            console.warn('[resume-analyze] Resume text too short:', cleanResumeText.length);
            return res.status(400).json({
                success: false,
                error: 'Resume text is too short. Please upload a valid resume.'
            });
        }

        console.log('[resume-analyze] Inputs validated. Calling AI analyzer...');

        // Call AI analysis
        let analysisResult;
        try {
            analysisResult = await analyzeResume(
                cleanResumeText,
                cleanJobDescription
            );
        } catch (aiError) {
            console.error('[resume-analyze] AI analysis failed:', {
                message: aiError?.message,
                code: aiError?.code,
                statusCode: aiError?.statusCode
            });

            const statusCode = aiError?.statusCode || 500;
            const errorMessage = aiError?.message || 'Resume analysis failed. Please try again.';

            return res.status(statusCode).json({
                success: false,
                error: errorMessage,
                code: aiError?.code,
                ...(process.env.NODE_ENV !== 'production' ? { stack: aiError?.stack } : {})
            });
        }

        console.log('[resume-analyze] Analysis completed successfully:', {
            model: analysisResult.model,
            fallbackUsed: analysisResult.fallbackUsed,
            hasParsed: Boolean(analysisResult.parsed),
            duration: analysisResult.duration
        });

        const totalDuration = Date.now() - startTime;
        console.log(`[resume-analyze] Total request time: ${totalDuration}ms`);
        console.log('[resume-analyze] ===== END ANALYSIS REQUEST (SUCCESS) =====');

        res.status(200).json({
            success: true,
            analysis: analysisResult.parsed,
            rawText: analysisResult.fallbackUsed ? analysisResult.rawText : undefined,
            model: analysisResult.model,
            fallbackUsed: analysisResult.fallbackUsed || false,
            duration: totalDuration
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[resume-analyze] Unhandled error after ${duration}ms:`, {
            message: error?.message,
            code: error?.code
        });
        console.log('[resume-analyze] ===== END ANALYSIS REQUEST (ERROR) =====');

        const statusCode = error?.statusCode || 500;
        const errorMessage = error?.message || 'An unexpected error occurred during analysis';

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            ...(process.env.NODE_ENV !== 'production' ? { stack: error?.stack } : {})
        });
    }
};

export default {
    uploadResume,
    analyzeResumeController
};
