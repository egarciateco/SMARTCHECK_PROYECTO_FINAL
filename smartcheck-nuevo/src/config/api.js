import axios from 'axios';

const api = axios.create({
  baseURL: 'https://smartcheck-proyecto-final.onrender.com', 
  timeout: 30000,
  // Headers eliminados de aquí para permitir que FormData gestione el Content-Type dinámicamente
});

// --- INTERCEPTORES DE DEBUG ---
api.interceptors.request.use(request => {
  console.log('🚀 ENVIANDO PETICIÓN A:', request.baseURL + request.url);
  return request;
});

api.interceptors.response.use(response => {
  return response;
}, error => {
  console.error('❌ ERROR DETECTADO:', error.message);
  if (error.response) {
    console.error('Detalles del error:', error.response.data);
  }
  return Promise.reject(error);
});
// ------------------------------

export const authService = {
  register: (userData, config) => api.post('/api/users/register', userData, config),
  login: (credentials, config) => api.post('/api/users/biometria', credentials, config),
};

export default api;