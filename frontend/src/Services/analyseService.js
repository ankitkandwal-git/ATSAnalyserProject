import axios from 'axios';

// Uses Vite dev-server proxy: /api -> http://localhost:5000
const API = '/api/resumes';

export const analyseService = {
  async analyseFile(file, jobDescription = '') {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const uploadResponse = await axios.post(`${API}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const extractedText = uploadResponse.data.extractedText;

      const analyzeResponse = await axios.post(`${API}/analyze`, {
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
