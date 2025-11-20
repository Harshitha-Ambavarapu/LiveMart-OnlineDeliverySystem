// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:5001'
});

// Attach token automatically and log header for debugging
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // DEBUG: show outgoing request url + auth presence
  // console.log('API request:', config.method, config.url, 'hasAuth=', !!token);
  return config;
}, (err) => Promise.reject(err));

export default API;
