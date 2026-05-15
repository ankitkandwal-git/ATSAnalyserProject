import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// API Key Management
// ============================================================================

const getApiKey = () => {
    const key = process.env.GEMINI_API_KEY?.trim();
    return key;
};

const validateApiKey = () => {
    const apiKey = getApiKey();
    if (!apiKey) {
        const error = new Error(
            'GEMINI_API_KEY is missing. Please set it in Render environment variables. ' +
            'Go to https://makersuite.google.com/app/apikeys to create an API key.'
        );
        error.statusCode = 500;
        error.code = 'MISSING_API_KEY';
        throw error;
    }
    return apiKey;
};

// ============================================================================
// Model Configuration
// ============================================================================

const MODEL_CANDIDATES = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-flash-latest'
];

// ============================================================================
// Prompt Building
// ============================================================================

const buildPrompt = (resumeText, jobDescription) => {
    return `
Analyze this resume for ATS optimization.

Resume:
${resumeText}

Job Description:
${jobDescription || 'General ATS Analysis'}

Return ONLY valid JSON (no markdown, no code fences) with this exact shape:
{
  "atsScore": number,
  "missingSkills": string[],
  "strengths": string[],
  "weaknesses": string[],
  "improvements": string[],
  "summary": string
}
`;
};

// ============================================================================
// JSON Response Handling
// ============================================================================

const stripJsonFences = (text) => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
};

const normalizeStringArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => String(item || '').trim())
        .filter((item) => item.length > 0);
};

const buildFallbackAnalysis = (reason = '') => ({
    atsScore: 0,
    missingSkills: [],
    strengths: [],
    weaknesses: [
        reason || 'AI analysis encountered an issue.',
        'The response was safely handled with fallback analysis.'
    ],
    improvements: [
        'Try uploading a cleaner PDF resume.',
        'Ensure the PDF contains extractable text.',
        'Verify the Gemini API is functioning correctly.'
    ],
    summary: reason || 'Analysis completed with fallback mode.'
});

const normalizeAnalysis = (parsed) => {
    try {
        if (!parsed || typeof parsed !== 'object') {
            console.warn('[ai-analyzer] Parsed result is not an object:', typeof parsed);
            return buildFallbackAnalysis('Response was not a valid object');
        }

        const atsScore = Number(parsed.atsScore);

        return {
            atsScore: Number.isFinite(atsScore)
                ? Math.max(0, Math.min(100, Math.round(atsScore)))
                : 0,
            missingSkills: normalizeStringArray(parsed.missingSkills),
            strengths: normalizeStringArray(parsed.strengths),
            weaknesses: normalizeStringArray(parsed.weaknesses),
            improvements: normalizeStringArray(parsed.improvements),
            summary: typeof parsed.summary === 'string' && parsed.summary.trim()
                ? parsed.summary.trim()
                : 'Analysis completed.'
        };
    } catch (error) {
        console.error('[ai-analyzer] Error normalizing analysis:', error);
        return buildFallbackAnalysis('Error normalizing response');
    }
};

const extractJsonObject = (text) => {
    try {
        if (!text || typeof text !== 'string') {
            console.warn('[ai-analyzer] Response text is not a string:', typeof text);
            return null;
        }

        const cleaned = stripJsonFences(text);
        if (!cleaned) {
            console.warn('[ai-analyzer] No content after stripping JSON fences');
            return null;
        }

        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
            console.warn('[ai-analyzer] No valid JSON braces found in response');
            console.log('[ai-analyzer] First 200 chars of response:', cleaned.substring(0, 200));
            return null;
        }

        const candidate = cleaned.slice(firstBrace, lastBrace + 1);
        console.log('[ai-analyzer] Attempting to parse JSON candidate');

        const parsed = JSON.parse(candidate);
        console.log('[ai-analyzer] JSON parsed successfully');
        return parsed;
    } catch (error) {
        console.error('[ai-analyzer] JSON parsing error:', error.message);
        return null;
    }
};

// ============================================================================
// Timeout Handling
// ============================================================================

const withTimeout = (promise, timeoutMs, label) => {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const error = new Error(
                `${label} timed out after ${timeoutMs}ms. ` +
                'The Gemini API is taking too long to respond. Try again in a moment.'
            );
            error.statusCode = 504;
            error.code = 'TIMEOUT';
            reject(error);
        }, timeoutMs);
    });

    return Promise.race([
        promise.finally(() => clearTimeout(timeoutId)),
        timeoutPromise
    ]);
};

// ============================================================================
// Error Detection
// ============================================================================

const isModelNotFoundError = (err) => {
    const message = String(err?.message || err);
    return message.includes('[404 Not Found]') && message.includes('models/');
};

const isRateLimitError = (err) => {
    const message = String(err?.message || err);
    return message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('too many');
};

const isAuthenticationError = (err) => {
    const message = String(err?.message || err);
    return message.includes('401') || message.includes('UNAUTHENTICATED') || message.includes('invalid API key');
};

// ============================================================================
// Model Creation
// ============================================================================

const getModel = (modelName) => {
    try {
        const apiKey = validateApiKey();
        console.log(`[ai-analyzer] Creating model instance: ${modelName}`);

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: 0.2,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048
            }
        });

        return model;
    } catch (error) {
        console.error(`[ai-analyzer] Failed to create model ${modelName}:`, error.message);
        throw error;
    }
};

// ============================================================================
// Main Analysis Function
// ============================================================================

export const analyzeResume = async (resumeText, jobDescription) => {
    const startTime = Date.now();

    try {
        console.log('[ai-analyzer] ===== START ANALYSIS =====');

        // Input validation
        const cleanResumeText = String(resumeText || '').trim();
        const cleanJobDescription = String(jobDescription || '').trim();

        console.log('[ai-analyzer] Input validation:', {
            resumeTextLength: cleanResumeText.length,
            jobDescriptionLength: cleanJobDescription.length
        });

        if (!cleanResumeText || cleanResumeText.length === 0) {
            const error = new Error('Resume text is required for analysis');
            error.statusCode = 400;
            error.code = 'EMPTY_RESUME';
            throw error;
        }

        // Verify API key before proceeding
        try {
            validateApiKey();
            console.log('[ai-analyzer] API key validation: OK');
        } catch (error) {
            console.error('[ai-analyzer] API key validation failed:', error.message);
            throw error;
        }

        const prompt = buildPrompt(
            cleanResumeText.slice(0, 30000),
            cleanJobDescription
        );

        console.log('[ai-analyzer] Prompt built, length:', prompt.length);

        let lastError = null;

        // Try each model candidate
        for (let i = 0; i < MODEL_CANDIDATES.length; i++) {
            const modelName = MODEL_CANDIDATES[i];

            try {
                console.log(
                    `[ai-analyzer] Attempting model ${i + 1}/${MODEL_CANDIDATES.length}: ${modelName}`
                );

                const model = getModel(modelName);

                console.log(`[ai-analyzer] Sending request to Gemini API (${modelName})...`);
                const startApiCall = Date.now();

                const result = await withTimeout(
                    model.generateContent(prompt),
                    90000,
                    `Gemini ${modelName} generateContent`
                );

                const apiDuration = Date.now() - startApiCall;
                console.log(`[ai-analyzer] API response received in ${apiDuration}ms`);

                // ================================================================
                // CRITICAL FIX: result IS the response, not result.response
                // ================================================================
                if (!result) {
                    throw new Error('Gemini API returned empty result');
                }

                // Extract text safely from the result
                let text = '';
                try {
                    if (typeof result.text === 'function') {
                        console.log('[ai-analyzer] Calling result.text() function');
                        text = result.text();
                    } else if (typeof result.text === 'string') {
                        console.log('[ai-analyzer] result.text is a string');
                        text = result.text;
                    } else {
                        console.warn('[ai-analyzer] result.text is neither function nor string:', typeof result.text);
                        text = '';
                    }
                } catch (textError) {
                    console.error('[ai-analyzer] Error extracting text from result:', textError.message);
                    text = '';
                }

                console.log(`[ai-analyzer] Extracted response text length: ${text.length}`);

                if (!text || text.length === 0) {
                    console.warn('[ai-analyzer] Received empty response text from Gemini');
                    throw new Error('Gemini API returned empty response text');
                }

                // Parse JSON from response
                const parsed = extractJsonObject(text);

                // Return success, even if fallback
                const analysis = parsed ? normalizeAnalysis(parsed) : buildFallbackAnalysis('JSON parsing failed');

                const totalDuration = Date.now() - startTime;
                console.log(`[ai-analyzer] Analysis complete in ${totalDuration}ms with model: ${modelName}`);
                console.log('[ai-analyzer] ===== END ANALYSIS (SUCCESS) =====');

                return {
                    model: modelName,
                    rawText: text || '',
                    parsed: analysis,
                    fallbackUsed: !parsed,
                    duration: totalDuration
                };

            } catch (modelError) {
                lastError = modelError;
                const duration = Date.now() - startTime;

                console.error(`[ai-analyzer] Model ${modelName} failed after ${duration}ms:`, {
                    message: modelError?.message,
                    code: modelError?.code,
                    statusCode: modelError?.statusCode
                });

                // If this is a 404 (model not found), try the next model
                if (isModelNotFoundError(modelError)) {
                    console.log(`[ai-analyzer] Model not found (404), trying next model...`);
                    continue;
                }

                // If this is a rate limit, throw immediately
                if (isRateLimitError(modelError)) {
                    console.error('[ai-analyzer] Rate limit hit');
                    modelError.statusCode = 429;
                    throw modelError;
                }

                // If this is authentication error, throw immediately
                if (isAuthenticationError(modelError)) {
                    console.error('[ai-analyzer] Authentication failed - invalid API key?');
                    modelError.statusCode = 401;
                    throw modelError;
                }

                // If timeout, throw immediately
                if (modelError.code === 'TIMEOUT' || modelError.statusCode === 504) {
                    console.error('[ai-analyzer] Timeout occurred');
                    throw modelError;
                }

                // Otherwise try the next model
                console.log(`[ai-analyzer] Continuing to next model...`);
            }
        }

        // All models exhausted
        console.error('[ai-analyzer] All models exhausted');
        const finalError = lastError || new Error('All Gemini models failed. Please try again later.');
        finalError.statusCode = finalError.statusCode || 502;
        finalError.code = finalError.code || 'ALL_MODELS_FAILED';
        throw finalError;

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[ai-analyzer] Analysis failed after ${duration}ms:`, {
            message: error?.message,
            code: error?.code,
            statusCode: error?.statusCode
        });
        console.log('[ai-analyzer] ===== END ANALYSIS (ERROR) =====');
        throw error;
    }
};

export default {
    analyzeResume
};
