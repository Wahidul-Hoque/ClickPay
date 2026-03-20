import axios from 'axios';
import { get } from 'http';

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
  changePin: (data: { oldPin: string; newPin: string }) => apiClient.post('/auth/change-pin', data),
};

export const transactionAPI = {
  send: (data: any) => apiClient.post('/transactions/send', data),
  request: (data: { recipientPhone: string; amount: number; message?: string }) => 
    apiClient.post('/transactions/request', data),
  getIncomingRequests: () => 
    apiClient.get('/transactions/requests/incoming'),
  getSentRequests: () => 
    apiClient.get('/transactions/requests/sent'),
  approveRequest: (requestId: string , epin: string) => 
    apiClient.post(`/transactions/requests/${requestId}/pay`, { epin }),
  updateRequestStatus: (requestId: string, status: 'declined' | 'cancelled') => 
    apiClient.patch(`/transactions/requests/${requestId}/status`, { status }),
  cashIn: (data: any) => apiClient.post('/transactions/cash-in', data),
  cashOut: (data: { agentPhone: string; amount: number; epin: string }) => 
    apiClient.post('/transactions/cash-out', data),
  getHistory: (params?: any) => apiClient.get('/transactions/history', { params }),
  getDetails: (id: string) => apiClient.get(`/transactions/${id}`),
};

export const walletAPI = {
  getBalance: () => apiClient.get('/wallets/balance'),
  getTransactions: (params?: any) => apiClient.get('/wallets/transactions', { params }),
  addPaymentMethod: (data: any) => apiClient.post('/wallets/payment-methods', data),
  getPaymentMethods: () => apiClient.get('/wallets/payment-methods'),
  removePaymentMethod: (id: string) => apiClient.delete(`/wallets/payment-methods/${id}`),
  topup: (data: any) => apiClient.post('/wallets/topup', data),
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
  getStatus: () => apiClient.get('/loans/status'),
  repay: (loanId: string) => apiClient.post(`/loans/repay/${loanId}`),
  apply: (data: {amount: number}) => apiClient.post('/loans/apply', data),
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

export const adminApi = {
    /** 1, 3, 5: Financial Analytics & User Behavior **/
    getAnalytics: async (city?: string) => {
        const url = city ? `/admin/analytics?city=${city}` : '/admin/analytics';
        const response = await apiClient.get(url);
        return response.data; // Returns revenue, churn, and trend data
    },

    /** 2, 11: Agent & Merchant Management **/
    getAgentPerformance: async (city?: string) => {
        const url = city ? `/admin/agents/performance?city=${city}` : '/admin/agents/performance';
        const response = await apiClient.get(url);
        return response.data; // Returns ranking and commission breakdown
    },

    /** 6, 7, 8: Loans, Savings & Subscriptions **/
    getPortfolioReports: async () => {
        const response = await apiClient.get('/admin/reports/portfolio');
        return response.data; // Returns loan risk, savings maturity, and MRR
    },

    /** 9: User Management & Account Controls **/
    getUsers: async (filters: { query?: string; status?: string; page?: number } = {}) => {
        const params = new URLSearchParams(filters as any).toString();
        const response = await apiClient.get(`/admin/users?${params}`);
        return response.data;
    },

    toggleUserStatus: async (userId: string, action: 'freeze' | 'unfreeze') => {
        const response = await apiClient.patch(`/admin/users/${userId}/status`, { action });
        return response.data;
    },

    /** 10: Reconciliation & Settlement **/
    getSettlementReport: async () => {
        const response = await apiClient.get('/admin/reconciliation/daily');
        return response.data; // Money in vs Money out
    },

    /** 12: System Audit & Admin Action Log **/
    getAuditLogs: async (limit = 50) => {
        const response = await apiClient.get(`/admin/audit-logs?limit=${limit}`);
        return response.data;
    },

    getDetailedLoans: async () => {
      // This maps to /api/v1/loans/admin/detailed in your backend
      const response = await apiClient.get('/loans/admin/detailed');
      return response.data;
    }
};


