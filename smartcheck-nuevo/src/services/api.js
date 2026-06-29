import axios from 'axios';

// La URL base es la raíz del servidor en Render
const api = axios.create({
  baseURL: 'https://smartcheck-proyecto-final.onrender.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptores para Debug (para que veas qué ocurre en tu terminal)
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

export const authService = {
  // Las rutas aquí suman el baseURL + este endpoint.
  // Como tu servidor usa /api/users como prefijo, estas son las rutas finales correctas:
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/users/biometria', credentials),
};

export default api;