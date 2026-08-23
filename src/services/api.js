import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  // Si testeas en red local usa tu IP. Si subiste todo a producción, cambia por tu URL de Render.
  baseURL: 'http://192.168.1.7:3000', 
  timeout: 30000,
});

// Interceptor para inyectar el Token automáticamente
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🚀 PETICIÓN A: ${config.baseURL}${config.url}`);
  return config;
}, (error) => Promise.reject(error));

// Interceptor para logs y errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
      console.error('❌ ERROR API (Recibido HTML en vez de JSON):');
      console.error('El servidor respondió con:', error.response.data.substring(0, 200));
    } else {
      console.error('❌ ERROR API:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// --- SERVICIOS CENTRALIZADOS ---
export const authService = {
  register: (userData) => api.post('/api/users/register', userData),
  loginBiometria: (formData) => api.post('/api/users/biometria', formData),
};

export const productService = {
  getByEan: (ean) => api.get(`/api/producto/${ean}`),
  // CORREGIDO: Se quitó el /users/ para que coincida exactamente con el servidor
  searchByText: (query) => api.get('/api/productos/buscar', { params: { q: query } }),
};

export const historyService = {
  getHistorial: (uid) => api.get(`/api/users/historial-compras/${uid}`),
  saveHistorial: (compraData) => api.post('/api/users/historial-compras', compraData),
};

export const supermarketService = {
  getCercanos: (lat, lng) => api.get('/api/supermercados/cercanos', { params: { lat, lng } }),
};

export default api;