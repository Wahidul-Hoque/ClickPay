// User related types
export interface AuthUser {
  user_id: number
  name: string
  phone: string
  role: 'user' | 'agent' | 'admin'
  status: string
}

export interface User {
  user_id: number
  name: string
  phone: string
  nid: string
  role: 'user' | 'agent' | 'admin'
  status: string
  created_at: string
}

// Wallet related types
export interface Wallet {
  wallet_id: number
  user_id: number
  balance: number
  status: string
}

// Transaction related types
export interface Transaction {
  transaction_id: number
  from_wallet_id: number
  to_wallet_id: number
  amount: number
  transaction_type: string
  status: string
  created_at: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Request types
export interface LoginRequest {
  phone: string
  epin: string
}

export interface SendMoneyRequest {
  toPhone: string
  amount: number
  reference?: string
}