import axios from 'axios';
import axiosRetry from 'axios-retry';

// La URL de tu backend en la nube
const api = axios.create({
  baseURL: 'https://smartcheck-proyecto-final.onrender.com', 
  timeout: 60000, // 60 segundos de espera para que el servidor responda
});

// --- CONFIGURACIÓN DE REINTENTOS AUTOMÁTICOS ---
// Esto hará que si el servidor está "durmiendo" y falla la primera vez, 
// la app vuelva a intentar conectarse automáticamente.
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
  // Aseguramos que la URL se imprima bien sumando baseURL y url
  const fullUrl = request.baseURL ? request.baseURL + request.url : request.url;
  console.log('🚀 ENVIANDO PETICIÓN A:', fullUrl);
  return request;
});

api.interceptors.response.use(response => {
  return response;
}, error => {
  console.error('❌ ERROR DETECTADO:', error.message);
  
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
  register: (userData, config) => api.post('/api/users/register', userData, config),
  login: (credentials, config) => api.post('/api/users/biometria', credentials, config),
};

export default api;