import axios from 'axios';
import axiosRetry from 'axios-retry';

// La URL de tu backend local para pruebas
const api = axios.create({
  baseURL: 'http://192.168.1.7:10000', 
  timeout: 60000, // 60 segundos de espera
});

// --- CONFIGURACIÓN DE REINTENTOS AUTOMÁTICOS ---
axiosRetry(api, { 
  retries: 3, 
  retryDelay: (retryCount) => {
    console.log(`⚠️ Servidor ocupado o durmiendo, reintentando... Intento: ${retryCount}`);
    return retryCount * 2000; // Espera 2, 4, 6 segundos
  },
  retryCondition: (error) => {
    // Reintenta si hay error de red o timeout
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  }
});

// --- INTERCEPTORES DE DEBUG ---
api.interceptors.request.use(request => {
  const fullUrl = request.baseURL ? request.baseURL + request.url : request.url;
  console.log('🚀 ENVIANDO PETICIÓN A:', fullUrl);
  return request;
});

api.interceptors.response.use(response => {
  return response;
}, error => {
  console.error('❌ ERROR DETECTADO:', error.message);
  
  // Lógica detallada restaurada para ayudarte a debugear:
  if (error.response) {
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
  // Nota: Al pasar el FormData directamente, axios gestiona el Content-Type y boundary correctamente
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/users/biometria', credentials),
};

export default api;