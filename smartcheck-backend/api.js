import axios from 'axios';

// Cambiamos la URL a la dirección pública de tu servidor en Render
const API_BASE_URL = 'https://smartcheck-proyecto-final.onrender.com/api/users';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Agregamos un timeout para que no se quede colgado eternamente si falla
  timeout: 10000, 
});

export default api;