'use client'

import { ArrowUpRight, ArrowDownLeft, Receipt, CreditCard } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  transaction_id: number
  amount: number
  transaction_type: string
  status: string
  created_at: string
  from_wallet_id: number
  to_wallet_id: number
  reference?: string
  from_wallet?: any
  to_wallet?: any
}

interface TransactionListProps {
  transactions: Transaction[]
  currentWalletId: number
}

export default function TransactionList({ transactions, currentWalletId }: TransactionListProps) {
  const getTransactionIcon = (type: string, isIncoming: boolean) => {
    if (type.includes('bill')) return Receipt
    if (type.includes('topup')) return CreditCard
    return isIncoming ? ArrowDownLeft : ArrowUpRight
  }

  const getTransactionColor = (isIncoming: boolean, status: string) => {
    if (status === 'failed') return 'text-red-600 bg-red-50'
    if (status === 'pending') return 'text-yellow-600 bg-yellow-50'
    return isIncoming ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No transactions yet</p>
          </div>
        ) : (
          transactions.map((transaction) => {
            const isIncoming = transaction.to_wallet_id === currentWalletId
            const Icon = getTransactionIcon(transaction.transaction_type, isIncoming)
            const colorClass = getTransactionColor(isIncoming, transaction.status)
            
            const otherParty = isIncoming 
              ? transaction.from_wallet?.user 
              : transaction.to_wallet?.user

            return (
              <div key={transaction.transaction_id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`${colorClass} p-3 rounded-full`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.transaction_type.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {otherParty && (
                          <p className="text-sm text-gray-500">
                            {isIncoming ? 'from' : 'to'} {otherParty.name || otherParty.phone}
                          </p>
                        )}
                        {transaction.reference && (
                          <span className="text-xs text-gray-400">• {transaction.reference}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy • hh:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${isIncoming ? 'text-green-600' : 'text-gray-900'}`}>
                      {isIncoming ? '+' : '-'} ৳{transaction.amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      transaction.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
