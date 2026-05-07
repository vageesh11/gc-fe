import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('gc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 session expired → clear token and redirect to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('gc_token');
      localStorage.removeItem('gc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
