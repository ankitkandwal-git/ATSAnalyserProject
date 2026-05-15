import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error(
        "GEMINI_API_KEY is missing. Add it to Backend/.env and restart the server."
    );
}

const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_CANDIDATES = [
    "gemini-1.5-flash",
    // Versioned variants sometimes remain available even when the alias is not
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-flash-latest",
    "gemini-2.5-flash"
];

const buildPrompt = (resumeText, jobDescription) => {

    return `
Analyze this resume for ATS optimization.

Resume:
${resumeText}

Job Description:
${jobDescription || "General ATS Analysis"}

Return ONLY valid JSON (no markdown, no code fences) with this exact shape:
{
  "atsScore": number,               // 0-100
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
    // Handles cases where the model still returns ```json ... ```
    return text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
};

const isModelNotFoundError = (err) => {
    const message = String(err?.message || err);
    return message.includes("[404 Not Found]") && message.includes("models/");
};

const getModel = (modelName) =>
    genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 0.2
        }
    });

export const analyzeResume = async (
    resumeText,
    jobDescription
) => {

    try {

        const prompt = buildPrompt(
            resumeText,
            jobDescription
        );

        let lastError;

        for (const modelName of MODEL_CANDIDATES) {
            try {
                const model = getModel(modelName);
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                const cleaned = stripJsonFences(text);

                try {
                    const parsed = JSON.parse(cleaned);
                    return {
                        model: modelName,
                        rawText: text,
                        parsed
                    };
                } catch {
                    return {
                        model: modelName,
                        rawText: text,
                        parsed: null
                    };
                }
            } catch (err) {
                lastError = err;
                if (isModelNotFoundError(err)) {
                    continue;
                }
                throw err;
            }
        }

        throw lastError || new Error("Gemini request failed");

    } catch (err) {

        console.error(
            "analyzeResume error:",
            err
        );

        throw err;
    }
};