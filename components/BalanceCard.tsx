'use client'

import { useState } from 'react'
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

interface BalanceCardProps {
  balance: number
  walletType?: string
}

export default function BalanceCard({ balance, walletType = 'user' }: BalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true)

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-primary-100 text-sm mb-1">Available Balance</p>
          <div className="flex items-center space-x-3">
            {showBalance ? (
              <h2 className="text-3xl font-bold">৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</h2>
            ) : (
              <h2 className="text-3xl font-bold">৳ ••••••</h2>
            )}
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div className="px-3 py-1 bg-white/20 rounded-full">
          <p className="text-xs font-medium capitalize">{walletType}</p>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button className="flex-1 bg-white text-primary-600 px-4 py-2.5 rounded-xl font-medium hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2">
          <ArrowUpRight className="w-4 h-4" />
          <span>Send</span>
        </button>
        <button className="flex-1 bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl font-medium hover:bg-white/30 transition-colors flex items-center justify-center space-x-2">
          <ArrowDownLeft className="w-4 h-4" />
          <span>Request</span>
        </button>
      </div>
    </div>
  )
}
