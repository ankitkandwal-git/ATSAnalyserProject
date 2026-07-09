import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export const analyseService = {
  async uploadResume(file) {
    try {
      if (!API_URL) {
        throw new Error('API URL is not configured. Set VITE_API_URL in frontend/.env.');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in first.');
      }

      const formData = new FormData();
      formData.append('resume', file);

      const uploadResponse = await axios.post(`${API_URL}/api/resumes/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token,
        },
      });

      return uploadResponse.data;
    } catch (error) {
      console.error('Error in uploadResume:', error);
      throw error;
    }
  },

  async queueAnalysis(resumeText, jobDescription = '') {
    try {
      if (!API_URL) {
        throw new Error('API URL is not configured. Set VITE_API_URL in frontend/.env.');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in first.');
      }

      const analyzeResponse = await axios.post(`${API_URL}/api/resumes/analyze`, {
        resumeText,
        jobDescription,
      }, {
        headers: {
          'Authorization': token,
        },
      });

      return analyzeResponse.data;
    } catch (error) {
      console.error('Error in queueAnalysis:', error);
      throw error;
    }
  },

  async getAnalysisJobStatus(jobId) {
    try {
      if (!API_URL) {
        throw new Error('API URL is not configured. Set VITE_API_URL in frontend/.env.');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in first.');
      }

      const response = await axios.get(`${API_URL}/api/resumes/jobs/${jobId}`, {
        headers: {
          'Authorization': token,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error in getAnalysisJobStatus:', error);
      throw error;
    }
  },
};
