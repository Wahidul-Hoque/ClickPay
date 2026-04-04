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
  updateProfile: (data: { name?: string; city?: string }) => apiClient.patch('/auth/profile', data),
  forgotPassword: (data: { phone: string }) => apiClient.post('/auth/forgot-password', data),
  verifyResetOtp: (data: { phone: string; otp: string }) => apiClient.post('/auth/verify-reset-otp', data),
  resetPassword: (data: { phone: string; otp: string; newEpin: string }) => apiClient.post('/auth/reset-password', data),
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
  getLimits: () => apiClient.get('/transactions/limits'),
  getDetails: (id: string) => apiClient.get(`/transactions/${id}`),
  reverse: (transactionId: string) => 
    apiClient.post(`/transactions/${transactionId}/reverse`),
};

export const walletAPI = {
  getBalance: () => apiClient.get('/wallets/balance'),
  getTransactions: (params?: any) => apiClient.get('/wallets/transactions', { params }),
  addPaymentMethod: (data: any) => apiClient.post('/wallets/payment-methods', data),
  getPaymentMethods: () => apiClient.get('/wallets/payment-methods'),
  removePaymentMethod: (id: string) => apiClient.delete(`/wallets/payment-methods/${id}`),
  topup: (data: any) => apiClient.post('/wallets/topup', data),
  getCurrentMonthExpenses : () => apiClient.get('/wallets/current-month-expense'),
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
  /**
   * Fetches all savings accounts for the logged-in user.
   * Backend: GET /api/savings/accounts
   */
  getAccounts: () => apiClient.get('/savings/accounts'),

  /**
   * Creates a new fixed savings account.
   * @param data { amount: number, durationMonths: number, epin: string }
   * Backend: POST /api/savings/create
   */
  create: (data: { amount: number; durationMonths: number; epin: string }) => 
    apiClient.post('/savings/create', data),

  /**
   * Closes or breaks an active savings account early.
   * @param id The fixed_savings_id
   * Backend: POST /api/savings/accounts/:id/break
   */
  break: (id: string | number) => 
    apiClient.post(`/savings/accounts/${id}/break`),
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
    sendNotification: async (data: { audience: string; message: string; phone?: string }) => 
        (await apiClient.post('/admin/notifications/send', data)).data,
    getSentNotifications: async (params?: { limit?: number }) =>
        (await apiClient.get('/admin/notifications/sent', { params })).data,
    getActiveSavings: async (params?: { limit?: number }) =>
        (await apiClient.get('/admin/savings/active', { params })).data,
    getAdminWalletReconciliation: async (period: 'day' | 'month') =>
        (await apiClient.get('/admin/reconciliation/wallet', { params: { period } })).data,

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
    },

    // Fraud Detection
    getFraudAlerts: async (status?: string) => {
      const params = status ? `?status=${status}` : '';
      const response = await apiClient.get(`/admin/fraud/alerts${params}`);
      return response.data;
    },

    resolveFraudAlert: async (alertId: number, action: 'freeze' | 'dismiss', note?: string) => {
      const response = await apiClient.post(`/admin/fraud/alerts/${alertId}/resolve`, { action, note });
      return response.data;
    },

    getFraudStats: async () => {
      const response = await apiClient.get('/admin/fraud/stats');
      return response.data;
    }
};

export const merchantAPI = {
  getMerchants: () => apiClient.get('/merchant'),
  getMerchantDetails: (id: string) => apiClient.get(`/merchant/${id}`),
  getDashboard: () => apiClient.get('/merchant/dashboard'),
  getRankings: (params: any) => apiClient.get('/merchant/rankings', { params }),
  getRegions: (q: string) => apiClient.get(`/merchant/regions?q=${q}`),
  getSubscriptionStatus: () => apiClient.get('/merchant/subscription/status'),
  subscribe: (data: { planType: 'monthly' | 'semi-annual'; epin: string }) => 
    apiClient.post('/merchant/subscription/subscribe', data),
  sendMoney: (data: { toPhone: string; amount: number; epin: string }) =>
    apiClient.post('/merchant/send', data),
};

export const subscriptionAPI = {
  // Ensure the string starts with '/subscriptions' 
  // to match the backend mounting point
  getDashboard: () => apiClient.get('/subscriptions/dashboard'),

  subscribe: (data: { merchantUserId: number; epin: string }) => 
    apiClient.post('/subscriptions/subscribe', data),

  // Note: Ensure the 'id' is passed correctly
  toggleRenew: (id: number) => 
    apiClient.patch(`/subscriptions/${id}/toggle-renew`),
};


export const paymentMethodAPI = {
  // Get available banks/cards (Master Data)
  getOptions: () => apiClient.get('/payment-methods/options'),
  
  // Link a new external account (Handshake)
  link: (data: any) => apiClient.post('/payment-methods/link', data),
  
  // Get the user's already linked accounts
  getMyMethods: () => apiClient.get('/payment-methods/my-methods'),
  
  // Perform the actual "Add Money" (Top-up) transaction
  topup: (data: { methodId: number | string; amount: number | string }) => 
    apiClient.post('/payment-methods/topup', data),
};

export const favoriteAPI = {
  addFavorite: (data: { type: 'number' | 'agent'; phone: string; name: string }) => 
    apiClient.post('/favorites', data),
  getFavorites: (type?: 'number' | 'agent') => 
    apiClient.get('/favorites', { params: { type } }),
  toggleFavorite: (id: string | number) =>
    apiClient.patch(`/favorites/${id}/toggle`),
};


export const systemAPI = {
  getSettings: () => apiClient.get('/system/settings'),
};
