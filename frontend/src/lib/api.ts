import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API methods
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  getProfile: () => apiClient.get('/auth/profile'),
  logout: () => apiClient.post('/auth/logout'),
};

export const transactionAPI = {
  send: (data: any) => apiClient.post('/transactions/send', data),
  request: (data: any) => apiClient.post('/transactions/request', data),
  cashIn: (data: any) => apiClient.post('/transactions/cash-in', data),
  cashOut: (data: any) => apiClient.post('/transactions/cash-out', data),
  getHistory: (params?: any) => apiClient.get('/transactions/history', { params }),
  getDetails: (id: string) => apiClient.get(`/transactions/${id}`),
};

export const walletAPI = {
  getBalance: () => apiClient.get('/wallet/balance'),
  getTransactions: (params?: any) => apiClient.get('/wallet/transactions', { params }),
  addPaymentMethod: (data: any) => apiClient.post('/wallet/payment-methods', data),
  getPaymentMethods: () => apiClient.get('/wallet/payment-methods'),
  topup: (data: any) => apiClient.post('/wallet/topup', data),
};

export const qrAPI = {
  generate: (data: any) => apiClient.post('/qr/generate', data),
  getMyCodes: () => apiClient.get('/qr/my-codes'),
  pay: (data: any) => apiClient.post('/qr/pay', data),
  getDetails: (id: string) => apiClient.get(`/qr/${id}`),
  revoke: (id: string) => apiClient.patch(`/qr/${id}/revoke`),
};

export const billAPI = {
  getBillers: () => apiClient.get('/bills/billers'),
  getBillersByCategory: (category: string) => apiClient.get(`/bills/billers/category/${category}`),
  pay: (data: any) => apiClient.post('/bills/pay', data),
  getHistory: () => apiClient.get('/bills/history'),
};

export const loanAPI = {
  apply: (data: any) => apiClient.post('/loans/apply', data),
  getApplications: () => apiClient.get('/loans/applications'),
  getActive: () => apiClient.get('/loans/active'),
  repay: (id: string, data: any) => apiClient.post(`/loans/${id}/repay`, data),
  getDetails: (id: string) => apiClient.get(`/loans/${id}`),
};

export const savingsAPI = {
  create: (data: any) => apiClient.post('/savings/create', data),
  getAccounts: () => apiClient.get('/savings/accounts'),
  getDetails: (id: string) => apiClient.get(`/savings/accounts/${id}`),
  break: (id: string) => apiClient.post(`/savings/accounts/${id}/break`),
  calculateInterest: (id: string) => apiClient.get(`/savings/accounts/${id}/interest`),
};

export const subscriptionAPI = {
  create: (data: any) => apiClient.post('/subscriptions/create', data),
  getMy: () => apiClient.get('/subscriptions/my-subscriptions'),
  getDetails: (id: string) => apiClient.get(`/subscriptions/${id}`),
  pause: (id: string) => apiClient.patch(`/subscriptions/${id}/pause`),
  resume: (id: string) => apiClient.patch(`/subscriptions/${id}/resume`),
  cancel: (id: string) => apiClient.delete(`/subscriptions/${id}`),
};

export const notificationAPI = {
  // Get all notifications with pagination
  getNotifications: (page = 1, limit = 20) => 
    apiClient.get('/notifications', { params: { page, limit } }),
  
  // Get recent notifications (last 10)
  getRecent: () => 
    apiClient.get('/notifications/recent'),
  
  // Delete specific notification
  deleteNotification: (notificationId: string) => 
    apiClient.delete(`/notifications/${notificationId}`),
  
  // Clear all notifications
  clearAll: () => 
    apiClient.delete('/notifications'),
};
