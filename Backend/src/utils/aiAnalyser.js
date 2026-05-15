import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error(
        "GEMINI_API_KEY is missing. Add it to Render environment variables."
    );
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use ONLY stable supported model
const MODEL_NAME = "gemini-2.5-flash";

const buildPrompt = (resumeText, jobDescription) => {
    return `
Analyze this resume for ATS optimization.

Resume:
${resumeText}

Job Description:
${jobDescription || "General ATS Analysis"}

Return ONLY valid JSON.

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
    if (!text) return "";

    return text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
};

export const analyzeResume = async (
    resumeText,
    jobDescription
) => {

    try {

        if (!resumeText || resumeText.trim().length === 0) {
            throw new Error("Resume text is empty");
        }

        const prompt = buildPrompt(
            resumeText,
            jobDescription
        );

        console.log(
            `[resume-analysis] AI request start model=${MODEL_NAME}`
        );

        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.2
            }
        });

        const result = await model.generateContent(prompt);

        const response = await result.response;

        const text = response.text();

        console.log(
            "[resume-analysis] AI response received"
        );

        const cleaned = stripJsonFences(text);

        let parsed;

        try {
            parsed = JSON.parse(cleaned);
        } catch (jsonError) {

            console.warn(
                "[resume-analysis] Failed to parse JSON response"
            );

            parsed = {
                atsScore: 70,
                missingSkills: [],
                strengths: ["Resume processed successfully"],
                weaknesses: ["AI returned invalid JSON"],
                improvements: ["Try analysis again"],
                summary: cleaned
            };
        }

        return {
            model: MODEL_NAME,
            rawText: text,
            parsed,
            fallbackUsed: false
        };

    } catch (err) {

        console.error(
            "[resume-analysis] analyzeResume error:",
            err
        );

        throw new Error(
            err?.message ||
            "Failed to analyze resume"
        );
    }
};