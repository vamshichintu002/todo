// Port configuration
export const FRONTEND_PORT = 5173;
export const BACKEND_PORT = 3001;

// Base URL for the backend API
const isDev = import.meta.env.DEV;
export const API_URL = isDev 
  ? `http://localhost:${BACKEND_PORT}`
  : import.meta.env.VITE_BACKEND_URL || 'https://investoaitest.netlify.app';

export const FRONTEND_URL = isDev
  ? `http://localhost:${FRONTEND_PORT}`
  : 'https://investoaitest.netlify.app';
