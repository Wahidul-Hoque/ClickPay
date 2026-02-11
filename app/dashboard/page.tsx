'use client'

import { useEffect, useState } from 'react'
import { getUserSession } from '@/lib/auth'
import { getUserWallet, getTransactionHistory } from '@/lib/database'
import BalanceCard from '@/components/BalanceCard'
import QuickActions from '@/components/QuickActions'
import TransactionList from '@/components/TransactionList'
import { TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const currentUser = getUserSession()
    if (!currentUser) return

    setUser(currentUser)

    // Load wallet
    const { data: walletData } = await getUserWallet(currentUser.user_id)
    if (walletData) {
      setWallet(walletData)

      // Load transactions
      const { data: txData } = await getTransactionHistory(walletData.wallet_id, 10)
      if (txData) {
        setTransactions(txData)
      }
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Calculate statistics
  const completedTransactions = transactions.filter(t => t.status === 'completed')
  const totalSent = completedTransactions
    .filter(t => t.from_wallet_id === wallet?.wallet_id)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  const totalReceived = completedTransactions
    .filter(t => t.to_wallet_id === wallet?.wallet_id)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h2>
        <p className="text-gray-600 mt-1">happening with your account today.</p>
      </div>

      {/* Balance Card */}
      <BalanceCard balance={wallet?.balance || 0} walletType={wallet?.wallet_type} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900">৳{totalSent.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Received</p>
              <p className="text-2xl font-bold text-gray-900">৳{totalReceived.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{completedTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Transactions */}
      <TransactionList transactions={transactions} currentWalletId={wallet?.wallet_id} />
    </div>
  )
}
