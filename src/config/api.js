// Platform Admin Configuration
// Central place for all API endpoints and configuration

// ==========================================
// API CONFIGURATION
// ==========================================
// All configuration loaded from environment variables (.env file)
// See .env.example for required variables
// ==========================================

// Environment variables (loaded from .env)
const DEV_MACHINE_IP = import.meta.env.VITE_DEV_MACHINE_IP || "192.168.1.9";
const DEV_PORT = import.meta.env.VITE_DEV_PORT || "5000";
const DEV_API_URL = `http://${DEV_MACHINE_IP}:${DEV_PORT}/api`;
const PROD_API_URL = import.meta.env.VITE_API_URL || "https://heedend-production.up.railway.app/api";

// Toggle from environment: Use Railway backend in development
const USE_RAILWAY_IN_DEV = import.meta.env.VITE_USE_RAILWAY_IN_DEV === "true";

// Determine environment and set API URL
const isDevelopment = import.meta.env.DEV;
export const API_BASE_URL = import.meta.env.VITE_API_URL 
  || (isDevelopment && !USE_RAILWAY_IN_DEV ? DEV_API_URL : PROD_API_URL);

// Individual endpoint builders
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    FORGOT_PASSWORD_SEND_OTP: `${API_BASE_URL}/auth/forgot-password/send-otp`,
    FORGOT_PASSWORD_VERIFY_OTP: `${API_BASE_URL}/auth/forgot-password/verify-otp`,
    FORGOT_PASSWORD_RESET: `${API_BASE_URL}/auth/forgot-password/reset`,
  },
  ADMIN: {
    STATS: `${API_BASE_URL}/admin/stats`,
    ANALYTICS: `${API_BASE_URL}/admin/analytics/recommendations`,
    APPROVALS: `${API_BASE_URL}/admin/approvals`,
    APPROVE: (id) => `${API_BASE_URL}/admin/approve/${id}`,
    REJECT: (id) => `${API_BASE_URL}/admin/reject/${id}`,
    USERS: (params = "") => `${API_BASE_URL}/admin/users${params}`,
    DELETED_USERS: `${API_BASE_URL}/admin/users/deleted`,
    REPORTS: `${API_BASE_URL}/admin/reports`,
    UPDATE_REPORT: (reportId) => `${API_BASE_URL}/admin/reports/${reportId}`,
    DELETE_POST: (postId) => `${API_BASE_URL}/admin/reports/post/${postId}`,
  },
  LEGAL: {
    LIST: `${API_BASE_URL}/legal/admin`,
    CREATE: `${API_BASE_URL}/legal/admin`,
    UPDATE: (id) => `${API_BASE_URL}/legal/admin/${id}`,
    TOGGLE: (id) => `${API_BASE_URL}/legal/admin/${id}/toggle`,
  },
  SELLER: {
    STATS: `${API_BASE_URL}/images/seller/stats`,
    POSTS: `${API_BASE_URL}/images/posts/me`,
    UPDATE_POST: (postId) => `${API_BASE_URL}/images/${postId}`,
    DELETE_POST: (postId) => `${API_BASE_URL}/images/${postId}`,
    ARCHIVE_POST: (postId) => `${API_BASE_URL}/images/${postId}/archive`,
    BOOST_STATUS: `${API_BASE_URL}/images/boost/status`,
    BOOST_POST: (postId) => `${API_BASE_URL}/images/boost/${postId}`,
    ORDERS: `${API_BASE_URL}/orders/seller/orders`,
    ORDER_STATUS: (orderId) => `${API_BASE_URL}/orders/${orderId}/status`,
  },
  IMAGES: {
    ALL: `${API_BASE_URL}/images`,
    FEED: `${API_BASE_URL}/images/feed`,
    BOOSTED: `${API_BASE_URL}/images/boost/all`,
  },
  ADS: {
    ALL: `${API_BASE_URL}/ads`,
    ACTIVE: `${API_BASE_URL}/ads/active`,
    ANALYTICS: `${API_BASE_URL}/ads/analytics`,
    CREATE: `${API_BASE_URL}/ads`,
    UPDATE: (id) => `${API_BASE_URL}/ads/${id}`,
    DELETE: (id) => `${API_BASE_URL}/ads/${id}`,
    TOGGLE: (id) => `${API_BASE_URL}/ads/${id}/toggle`,
    PAYMENT: (id) => `${API_BASE_URL}/ads/${id}/payment`,
    CLICK: (id) => `${API_BASE_URL}/ads/${id}/click`,
  },
  CONTACT: {
    SUBMIT: `${API_BASE_URL}/contact`,
    MESSAGES: `${API_BASE_URL}/contact/messages`,
  },
};

// Helper function for dynamic endpoints
export const getApiUrl = (endpoint, params = null) => {
  if (typeof endpoint === "function") {
    return endpoint(params);
  }
  return endpoint;
};

// Helper to get document URL (handles both old full URLs and new filenames)
export const getDocumentUrl = (docPath) => {
  if (!docPath) return null;
  
  // If it's already a full URL, return as-is
  if (docPath.startsWith("http")) {
    return docPath;
  }
  
  // ✅ FIX: Don't split/strip the folder! Encode the full path instead.
  // This allows paths like "public/my-image.jpg" to be passed correctly.
  const encodedPath = encodeURIComponent(docPath);
  return `${API_BASE_URL}/auth/document/${encodedPath}`;
};

export default API_ENDPOINTS;
