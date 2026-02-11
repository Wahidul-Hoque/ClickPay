import { supabase } from './supabase'

// Get user's wallet
export const getUserWallet = async (userId: number) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('wallet_type', 'user')
    .single()

  return { data, error }
}

// Get all wallets for a user (including agent wallets if applicable)
export const getAllUserWallets = async (userId: number) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)

  return { data, error }
}

// Get transaction history
export const getTransactionHistory = async (walletId: number, limit = 50) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      from_wallet:wallets!transactions_from_wallet_id_fkey(
        wallet_id,
        user:users(user_id, name, phone)
      ),
      to_wallet:wallets!transactions_to_wallet_id_fkey(
        wallet_id,
        user:users(user_id, name, phone)
      )
    `)
    .or(`from_wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data, error }
}

// Send money
export const sendMoney = async (
  fromWalletId: number,
  toPhone: string,
  amount: number,
  reference?: string
) => {
  try {
    // Get recipient's wallet
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('user_id')
      .eq('phone', toPhone)
      .single()

    if (recipientError || !recipient) {
      return { success: false, error: 'Recipient not found' }
    }

    const { data: toWallet, error: toWalletError } = await supabase
      .from('wallets')
      .select('wallet_id, balance')
      .eq('user_id', recipient.user_id)
      .eq('wallet_type', 'user')
      .single()

    if (toWalletError || !toWallet) {
      return { success: false, error: 'Recipient wallet not found' }
    }

    // Check sender balance
    const { data: fromWallet, error: fromWalletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('wallet_id', fromWalletId)
      .single()

    if (fromWalletError || !fromWallet) {
      return { success: false, error: 'Sender wallet not found' }
    }

    if (fromWallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' }
    }

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        from_wallet_id: fromWalletId,
        to_wallet_id: toWallet.wallet_id,
        amount,
        transaction_type: 'send_money',
        status: 'initiated',
        reference
      })
      .select()
      .single()

    if (transactionError) {
      return { success: false, error: 'Transaction failed' }
    }

    // Update balances
    const { error: debitError } = await supabase
      .from('wallets')
      .update({ balance: fromWallet.balance - amount })
      .eq('wallet_id', fromWalletId)

    if (debitError) {
      return { success: false, error: 'Failed to debit sender' }
    }

    const { error: creditError } = await supabase
      .from('wallets')
      .update({ balance: toWallet.balance + amount })
      .eq('wallet_id', toWallet.wallet_id)

    if (creditError) {
      // Rollback sender balance
      await supabase
        .from('wallets')
        .update({ balance: fromWallet.balance })
        .eq('wallet_id', fromWalletId)
      
      return { success: false, error: 'Failed to credit recipient' }
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('transaction_id', transaction.transaction_id)

    // Create transaction event
    await supabase
      .from('transaction_events')
      .insert({
        transaction_id: transaction.transaction_id,
        event_type: 'completed',
        event_status: 'success',
        details: 'Transaction completed successfully'
      })

    return { success: true, transaction }
  } catch (error) {
    return { success: false, error: 'Transaction failed' }
  }
}

// Get notifications
export const getNotifications = async (userId: number, limit = 20) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data, error }
}

// Get money requests
export const getMoneyRequests = async (userId: number) => {
  const { data, error } = await supabase
    .from('money_requests')
    .select(`
      *,
      requester:users!money_requests_requester_user_id_fkey(name, phone),
      requestee:users!money_requests_requestee_user_id_fkey(name, phone)
    `)
    .or(`requester_user_id.eq.${userId},requestee_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Get QR codes
export const getQRCodes = async (userId: number) => {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Get merchant profile
export const getMerchantProfile = async (userId: number) => {
  const { data, error } = await supabase
    .from('merchant_profiles')
    .select('*')
    .eq('merchant_user_id', userId)
    .single()

  return { data, error }
}

// Get subscriptions
export const getSubscriptions = async (userId: number) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      merchant:users!subscriptions_merchant_user_id_fkey(name, phone)
    `)
    .eq('subscriber_user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Get loans
export const getLoans = async (userId: number) => {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Get savings accounts
export const getSavingsAccounts = async (userId: number) => {
  const { data, error } = await supabase
    .from('fixed_savings_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Get billers
export const getBillers = async () => {
  const { data, error } = await supabase
    .from('billers')
    .select('*')
    .eq('status', 'active')
    .order('name')

  return { data, error }
}

// Get bill payments
export const getBillPayments = async (walletId: number) => {
  const { data, error } = await supabase
    .from('bill_payments')
    .select(`
      *,
      biller:billers(name, category)
    `)
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })

  return { data, error }
}
