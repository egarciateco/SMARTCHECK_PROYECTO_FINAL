import axios from 'axios';
import axiosRetry from 'axios-retry';

// --- CONFIGURACIÓN CENTRAL ---
const api = axios.create({
  baseURL: 'http://192.168.1.7:3000', 
  timeout: 60000, 
});

// --- CONFIGURACIÓN DE REINTENTOS INTELIGENTES ---
axiosRetry(api, { 
  retries: 3, 
  retryDelay: (retryCount) => {
    console.log(`⚠️ Servidor reconectando, reintentando... Intento: ${retryCount}`);
    return retryCount * 2500; 
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.code === 'ECONNABORTED' || 
           (error.response && error.response.status >= 500);
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
    }
    return Promise.reject(error);
  }
);

// --- SERVICIOS CON RUTAS CENTRALIZADAS ---
export const authService = {
  register: (formData) => api.post('/api/users/register', formData),
  loginBiometric: (formData) => api.post('/api/users/biometria', formData),
  registerFacial: (formData) => api.post('/api/users/register-facial', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const productService = {
  // Corregido: Sin el /users/ extra
  getByEan: (ean) => api.get(`/api/producto/${ean}`),
  // Corregido: Sin el /users/ extra (el server usa /api/productos/buscar)
  searchByText: (query) => api.get('/api/productos/buscar', { params: { q: query } }),
};

// 🛒 Servicio centralizado para el Historial de Compras
export const historyService = {
  getHistorial: (uid) => api.get(`/api/users/historial-compras/${uid}`),
  saveHistorial: (compraData) => api.post('/api/users/historial-compras', compraData),
};

// 📍 Servicio centralizado para Supermercados Cercanos
export const supermarketService = {
  getCercanos: (lat, lng) => api.get('/api/supermercados/cercanos', { params: { lat, lng } }),
};

export default api;