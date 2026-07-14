import axios from 'axios';

// Usamos la IP que descubriste y el puerto 10000
const api = axios.create({
  baseURL: 'http://192.168.1.7:10000/api/users',
  timeout: 10000, // Tiempo máximo de espera
});

export default api;