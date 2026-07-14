import axios from 'axios';

// Cambia 'TU_IP_LOCAL' por la dirección IPv4 que encontraste (ej: 192.168.1.15)
const API_BASE_URL = 'http://TU_IP_LOCAL:10000/api/users';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;