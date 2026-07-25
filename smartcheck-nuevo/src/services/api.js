import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://smartcheck-proyecto-final.onrender.com', // Cambiar por tu IP local si testeas en red local (ej: http://192.168.1.7:10000)
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

// Centralizamos los servicios
export const authService = {
  register: (userData) => api.post('/api/users/register', userData),
  loginBiometria: (formData) => api.post('/api/users/biometria', formData),
  buscarProducto: (codigo) => api.get('/api/users/productos/buscar', { params: { q: codigo } }),
};

export default api;