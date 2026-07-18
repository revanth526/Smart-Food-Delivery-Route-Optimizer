import axios from 'axios';

// Connect to our Node Express API server (supports dynamic URL for production deployment)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

// Axios Request interceptor to automatically attach JWT authorization tokens
api.interceptors.request.use(
  (config) => {
    const session = localStorage.getItem('user_session');
    if (session) {
      try {
        const { token } = JSON.parse(session);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Error parsing session token:', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
