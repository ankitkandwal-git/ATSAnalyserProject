import fs from 'fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export const extractTextFromPDF = async (filePath) => {
    if (!filePath) {
        throw new Error('PDF file path is required');
    }

    try {
        await fs.access(filePath);

        const fileBuffer = await fs.readFile(filePath);
        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error('Uploaded PDF file is empty');
        }

        const data = new Uint8Array(fileBuffer);
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
        }

        return text.trim();
    } catch (error) {
        const parseError = new Error('Failed to parse PDF resume');
        parseError.cause = error;
        throw parseError;
    }
};