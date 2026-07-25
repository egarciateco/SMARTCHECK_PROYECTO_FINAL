import axios from 'axios';
import axiosRetry from 'axios-retry';

// --- CONFIGURACIÓN CENTRAL ---
const api = axios.create({
  baseURL: 'https://smartcheck-proyecto-final.onrender.com', 
  // 60 segundos de timeout para permitir que Render despierte del modo suspensión (Cold Start)
  timeout: 60000, 
});

// --- CONFIGURACIÓN DE REINTENTOS INTELIGENTES ---
axiosRetry(api, { 
  retries: 2, 
  retryDelay: (retryCount) => {
    console.log(`⚠️ Servidor despertando ocupado, reintentando... Intento: ${retryCount}`);
    return retryCount * 2000;
  },
  retryCondition: (error) => {
    // Solo permitimos reintentos automáticos en peticiones GET
    const isGetMethod = error.config?.method?.toLowerCase() === 'get';
    return isGetMethod && axiosRetry.isNetworkOrIdempotentRequestError(error);
  }
});

// --- INTERCEPTORES DE DEBUG ---
api.interceptors.request.use(request => {
  const fullUrl = (request.baseURL || '') + (request.url || '');
  console.log('🚀 [API] Enviando petición a:', fullUrl);
  return request;
});

api.interceptors.response.use(
  response => response, 
  error => {
    console.log('⚠️ [API] Respuesta con error controlado en:', error.config?.url);
    
    if (error.response) {
      console.log('⚠️ Status:', error.response.status);
      if (typeof error.response.data === 'string') {
        console.log('⚠️ Contenido recibido:', error.response.data.substring(0, 150));
      } else {
        console.log('⚠️ Detalles:', error.response.data);
      }
    } else {
      console.log('❌ Error de red o Timeout:', error.message);
    }
    return Promise.reject(error);
  }
);

// --- SERVICIOS CON RUTAS EXPLÍCITAS ---
export const authService = {
  register: (formData) => api.post('/api/users/register', formData),
  loginBiometric: (formData) => api.post('/api/users/biometria', formData),
  // 🚀 NUEVO: Método integrado para el registro facial usando Axios (con headers automáticos para FormData)
  registerFacial: (formData) => api.post('/api/users/register-facial', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;