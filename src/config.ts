// Port configuration
export const FRONTEND_PORT = 5173;
export const BACKEND_PORT = 8888;

// Base URL for the backend API
const isDev = import.meta.env.DEV;
export const API_URL = isDev 
  ? `http://localhost:${BACKEND_PORT}/.netlify/functions`
  : 'https://investoaitest.netlify.app/.netlify/functions';

export const FRONTEND_URL = isDev
  ? `http://localhost:${FRONTEND_PORT}`
  : 'https://investoaitest.netlify.app';
