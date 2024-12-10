// API configuration
const isProd = import.meta.env.PROD;
const prodApiUrl = 'https://todo-three-lyart-41.vercel.app';
const devApiUrl = 'http://localhost:3001';

export const API_CONFIG = {
  baseURL: isProd ? prodApiUrl : devApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

// Helper function to get the full API URL
export function getApiUrl(endpoint: string): string {
  const baseUrl = API_CONFIG.baseURL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${baseUrl}/${cleanEndpoint}`;
}

// Helper function to handle API errors
export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: 'No response from server',
      status: 0,
      data: null
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      message: error.message || 'Request configuration error',
      status: 0,
      data: null
    };
  }
}
