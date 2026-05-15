import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const analyseService = {
  async analyseFile(file, jobDescription = '') {
    try {
      if (!API_URL) {
        throw new Error('API URL is not configured. Set VITE_API_URL in frontend/.env.');
      }

      const formData = new FormData();
      formData.append('resume', file);

      const uploadResponse = await axios.post(`${API_URL}/api/resumes/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const extractedText = uploadResponse.data.extractedText;

      const analyzeResponse = await axios.post(`${API_URL}/api/resumes/analyze`, {
        resumeText: extractedText,
        jobDescription,
      });

      return analyzeResponse.data;
    } catch (error) {
      console.error('Error in analyseFile:', error);
      throw error;
    }
  },
};
