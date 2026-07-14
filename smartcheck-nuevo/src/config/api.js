import axios from 'axios';

// Asegúrate de usar 'http' (sin s) si no tienes certificados SSL configurados localmente
const api = axios.create({
  baseURL: 'http://192.168.1.7:10000', 
  timeout: 30000,
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
    // Si la respuesta es un string (posible HTML de error), lo mostramos para depurar
    if (typeof error.response.data === 'string') {
      console.error('El servidor devolvió contenido inesperado (posible HTML):', error.response.data.substring(0, 100));
    } else {
      console.error('Detalles del error:', error.response.data);
    }
  }
  
  return Promise.reject(error);
});
// ------------------------------

export const authService = {
  register: (userData, config) => api.post('/api/users/register', userData, config),
  login: (credentials, config) => api.post('/api/users/biometria', credentials, config),
};

export default api;