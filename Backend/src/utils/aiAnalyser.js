import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getApiKey = () => process.env.GEMINI_API_KEY?.trim();

const MODEL_CANDIDATES = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-flash-latest',
    'gemini-2.5-flash'
];

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

const stripJsonFences = (text) => {
    if (!text) return text;

    return text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
};

const normalizeStringArray = (value) =>
    Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean)
        : [];

const buildFallbackAnalysis = (summary = 'AI analysis is temporarily unavailable.') => ({
    atsScore: 0,
    missingSkills: [],
    strengths: [],
    weaknesses: ['The AI response could not be parsed safely.'],
    improvements: [
        'Try again with a cleaner PDF resume.',
        'Verify the Gemini API key and model availability.'
    ],
    summary
});

const normalizeAnalysis = (parsed) => {
    if (!parsed || typeof parsed !== 'object') {
        return buildFallbackAnalysis();
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
};

const extractJsonObject = (text) => {
    if (!text) {
        return null;
    }

    const cleaned = stripJsonFences(text);
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
    }

    const candidate = cleaned.slice(firstBrace, lastBrace + 1);

    try {
        return JSON.parse(candidate);
    } catch {
        return null;
    }
};

const withTimeout = (promise, timeoutMs, label) => {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const error = new Error(`${label} timed out after ${timeoutMs}ms`);
            error.statusCode = 504;
            reject(error);
        }, timeoutMs);
    });

    return Promise.race([
        promise.finally(() => clearTimeout(timeoutId)),
        timeoutPromise
    ]);
};

const isModelNotFoundError = (err) => {
    const message = String(err?.message || err);
    return message.includes('[404 Not Found]') && message.includes('models/');
};

const getModel = (modelName) => {
    const apiKey = getApiKey();

    if (!apiKey) {
        const error = new Error('GEMINI_API_KEY is missing. Set it in your Render environment variables.');
        error.statusCode = 500;
        throw error;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    return genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 0.2
        }
    });
};

export const analyzeResume = async (resumeText, jobDescription) => {
    try {
        const cleanResumeText = String(resumeText || '').trim();
        const cleanJobDescription = String(jobDescription || '').trim();

        if (!cleanResumeText) {
            const error = new Error('Resume text is required for analysis');
            error.statusCode = 400;
            throw error;
        }

        const prompt = buildPrompt(
            cleanResumeText.slice(0, 30000),
            cleanJobDescription
        );

        let lastError;

        for (const modelName of MODEL_CANDIDATES) {
            try {
                console.log(`[resume-analysis] AI request start model=${modelName} resumeTextLength=${cleanResumeText.length}`);

                const model = getModel(modelName);
                const result = await withTimeout(
                    model.generateContent(prompt),
                    90000,
                    'Gemini generateContent'
                );
                const response = await result.response;
                const text = typeof response?.text === 'function' ? response.text() : '';

                console.log(`[resume-analysis] AI response received model=${modelName} textLength=${text.length}`);

                const parsed = extractJsonObject(text);

                return {
                    model: modelName,
                    rawText: text || '',
                    parsed: parsed ? normalizeAnalysis(parsed) : buildFallbackAnalysis(),
                    fallbackUsed: !parsed
                };
            } catch (err) {
                lastError = err;
                console.error(`[resume-analysis] model failed model=${modelName}`, err);

                if (isModelNotFoundError(err)) {
                    continue;
                }

                throw err;
            }
        }

        const finalError = lastError || new Error('Gemini request failed');
        finalError.statusCode = finalError.statusCode || 502;
        throw finalError;
    } catch (err) {
        console.error('analyzeResume error:', err);
        throw err;
    }
};