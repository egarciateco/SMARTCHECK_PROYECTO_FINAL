import axios from 'axios';

// La URL de tu backend desplegado en Render
const API_BASE_URL = 'https://smartcheck-proyecto-final.onrender.com/api/users';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;