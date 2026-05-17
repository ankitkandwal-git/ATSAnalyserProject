import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const analyseService = {
  async analyseFile(file, jobDescription = '') {
    try {
      if (!API_URL) {
        throw new Error('API URL is not configured. Set VITE_API_URL in frontend/.env.');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[analyseService] No auth token found. Upload may still work if backend allows anonymous upload.');
      }

      const formData = new FormData();
      formData.append('resume', file);

      console.log('[analyseService] Sending resume upload request...');

      const uploadResponse = await axios.post(`${API_URL}/api/resumes/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: token } : {}),
        },
      });

      console.log('[analyseService] uploadResponse.data:', uploadResponse.data);

      const extractedText = uploadResponse.data?.extractedText ?? uploadResponse.data?.resumeText ?? uploadResponse.data?.text ?? uploadResponse.data?.parsedText;

      if (!extractedText || !extractedText.trim()) {
        const foundKeys = Object.keys(uploadResponse.data || {}).filter((key) => ['extractedText', 'resumeText', 'text', 'parsedText'].includes(key));
        console.error('[analyseService] Missing extracted text in upload response. Available keys:', foundKeys, 'response:', uploadResponse.data);
        throw new Error('Could not read extracted text from upload response.');
      }

      const analyzePayload = {
        resumeText: extractedText,
        jobDescription,
      };

      console.log('[analyseService] Sending analyze request payload:', analyzePayload);

      const analyzeResponse = await axios.post(`${API_URL}/api/resumes/analyze`, analyzePayload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[analyseService] analyzeResponse.data:', analyzeResponse.data);

      return analyzeResponse.data;
    } catch (error) {
      console.error('[analyseService] Error in analyseFile:', error?.response?.data ?? error.message ?? error);
      throw error;
    }
  },
};
