'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserSession } from '@/lib/auth'
import { getUserWallet, getTransactionHistory } from '@/lib/database'
import { ArrowLeft, Search, Download, Filter } from 'lucide-react'
import TransactionList from '@/apps/frontend/app/src/components/TransactionList'

export default function TransactionsPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, filterType, filterStatus])

  const loadData = async () => {
    const currentUser = getUserSession()
    if (!currentUser) {
      router.push('/login')
      return
    }

    const { data: walletData } = await getUserWallet(currentUser.user_id)
    if (walletData) {
      setWallet(walletData)

      const { data: txData } = await getTransactionHistory(walletData.wallet_id, 100)
      if (txData) {
        setTransactions(txData)
      }
    }

    setLoading(false)
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.transaction_type === filterType)
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus)
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from_wallet?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to_wallet?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from_wallet?.user?.phone?.includes(searchTerm) ||
        tx.to_wallet?.user?.phone?.includes(searchTerm)
      )
    }

    setFilteredTransactions(filtered)
  }

  const transactionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'send_money', label: 'Send Money' },
    { value: 'receive_money', label: 'Receive Money' },
    { value: 'bill_payment', label: 'Bill Payment' },
    { value: 'topup', label: 'Top-up' },
    { value: 'cashout', label: 'Cash Out' },
  ]

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ]

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Status', 'Reference'],
      ...filteredTransactions.map(tx => [
        new Date(tx.created_at).toLocaleDateString(),
        tx.transaction_type,
        tx.amount,
        tx.status,
        tx.reference || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>

          <button
            onClick={exportTransactions}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Search transactions..."
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {transactionTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterType('all')
                setFilterStatus('all')
              }}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <TransactionList transactions={filteredTransactions} currentWalletId={wallet?.wallet_id} />
        )}
      </div>
    </div>
  )
}
