// Application configuration
// 🔒 PRODUCTION READY: All URLs use environment variables with production fallbacks
export const APP_CONFIG = {
  // Streamlit app URL (main application)
  STREAMLIT_URL: process.env.REACT_APP_STREAMLIT_URL || (
    process.env.NODE_ENV === 'production' 
      ? 'https://your-streamlit-domain.com' 
      : 'http://localhost:8501'
  ),
  
  // Backend API URL
  BACKEND_API_URL: process.env.REACT_APP_API_URL || (
    process.env.NODE_ENV === 'production' 
      ? 'https://your-api-domain.com' 
      : 'http://localhost:8000'
  ),
  
  // Auth Service URL
  AUTH_SERVICE_URL: process.env.REACT_APP_AUTH_API_URL || (
    process.env.NODE_ENV === 'production' 
      ? 'https://your-auth-domain.com' 
      : 'http://localhost:8001'
  ),
  
  // WebSocket URL
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || (
    process.env.NODE_ENV === 'production' 
      ? 'wss://your-websocket-domain.com' 
      : 'ws://localhost:5000'
  ),
  
  // Authentication endpoints
  AUTH_ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh'
  },
  
  // Local storage keys
  STORAGE_KEYS: {
    USER_DATA: 'devassist_user',
    AUTH_TOKEN: 'devassist_token',
    REFRESH_TOKEN: 'devassist_refresh_token'
  },
  
  // Development settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // Default ports
  PORTS: {
    REACT_APP: 3000,
    STREAMLIT_APP: 8501,
    BACKEND_API: 8000,
    AUTH_SERVICE: 8001,
    LLM_SERVICE: 8002,
    DOCUMENTS_SERVICE: 8003,
    DASHBOARD_SERVICE: 8004
  }
} as const;

// Helper function to get Streamlit URL with fallback
export const getStreamlitUrl = (): string => {
  return APP_CONFIG.STREAMLIT_URL;
};

// Helper function to get backend API URL
export const getBackendApiUrl = (): string => {
  return APP_CONFIG.BACKEND_API_URL;
};

// Helper function to get auth service URL
export const getAuthServiceUrl = (): string => {
  return APP_CONFIG.AUTH_SERVICE_URL;
};

// Helper function to get WebSocket URL
export const getSocketUrl = (): string => {
  return APP_CONFIG.SOCKET_URL;
};

// Helper function to build service URLs
export const buildServiceUrl = (service: 'api' | 'auth' | 'socket', path: string = ''): string => {
  const baseUrls = {
    api: APP_CONFIG.BACKEND_API_URL,
    auth: APP_CONFIG.AUTH_SERVICE_URL,
    socket: APP_CONFIG.SOCKET_URL
  };
  
  return `${baseUrls[service]}${path}`;
};

// Helper function to store user authentication data
export const storeUserData = (userData: {
  email: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
}) => {
  const authData = {
    ...userData,
    loginTime: new Date().toISOString(),
    isAuthenticated: true
  };
  
  localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(authData));
};

// Helper function to clear authentication data
export const clearUserData = () => {
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  try {
    const userData = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
    if (!userData) return false;
    
    const parsed = JSON.parse(userData);
    return parsed.isAuthenticated === true;
  } catch {
    return false;
  }
};

// Helper function to get user data
export const getUserData = () => {
  try {
    const userData = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};