import { supabase } from './supabase'

export interface AuthUser {
  user_id: number
  name: string
  phone: string
  role: 'user' | 'agent' | 'admin'
  status: string
}

// Store user session in localStorage
export const setUserSession = (user: AuthUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('clickpay_user', JSON.stringify(user))
  }
}

export const getUserSession = (): AuthUser | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('clickpay_user')
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

export const clearUserSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('clickpay_user')
  }
}

// Login with phone and ePin
export const loginUser = async (phone: string, epin: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, phone, nid, epin_hash, role, status')
      .eq('phone', phone)
      .single()

    if (error || !data) {
      return { success: false, error: 'User not found' }
    }

    // In production, you should hash the epin and compare with epin_hash
    // For now, we'll do a simple comparison (you'll need to implement proper hashing)
    // const isValidPin = await bcrypt.compare(epin, data.epin_hash)
    
    // Temporary: direct comparison (REPLACE THIS WITH PROPER HASHING)
    const isValidPin = epin === '1234' // You need to implement proper verification
    
    if (!isValidPin) {
      return { success: false, error: 'Invalid ePin' }
    }

    if (data.status !== 'active') {
      return { success: false, error: 'Account is not active' }
    }

    const user: AuthUser = {
      user_id: data.user_id,
      name: data.name,
      phone: data.phone,
      role: data.role,
      status: data.status
    }

    setUserSession(user)
    return { success: true, user }
  } catch (error) {
    return { success: false, error: 'Login failed' }
  }
}

// Register new user
export const registerUser = async (
  name: string,
  phone: string,
  nid: string,
  epin: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
  try {
    // Check if phone or NID already exists
    const { data: existing } = await supabase
      .from('users')
      .select('phone, nid')
      .or(`phone.eq.${phone},nid.eq.${nid}`)
      .single()

    if (existing) {
      return { success: false, error: 'Phone or NID already registered' }
    }

    // In production, hash the epin before storing
    // const hashedPin = await bcrypt.hash(epin, 10)
    const hashedPin = epin // TEMPORARY - implement proper hashing

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name,
        phone,
        nid,
        epin_hash: hashedPin,
        role: 'user',
        status: 'active'
      })
      .select()
      .single()

    if (insertError || !newUser) {
      return { success: false, error: 'Registration failed' }
    }

    // Create wallet for the user
    const { error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: newUser.user_id,
        wallet_type: 'user',
        balance: 0,
        status: 'active'
      })

    if (walletError) {
      return { success: false, error: 'Failed to create wallet' }
    }

    const user: AuthUser = {
      user_id: newUser.user_id,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status
    }

    setUserSession(user)
    return { success: true, user }
  } catch (error) {
    return { success: false, error: 'Registration failed' }
  }
}

export const logout = () => {
  clearUserSession()
}
