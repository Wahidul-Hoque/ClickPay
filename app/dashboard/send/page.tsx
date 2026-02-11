'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserSession } from '@/lib/auth'
import { getUserWallet, sendMoney } from '@/lib/database'
import { ArrowLeft, Send, Phone } from 'lucide-react'

export default function SendMoneyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [recipientPhone, setRecipientPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const currentUser = getUserSession()
    if (!currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)

    const { data: walletData } = await getUserWallet(currentUser.user_id)
    if (walletData) {
      setWallet(walletData)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    if (!recipientPhone || !amount) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }

    if (amountNum > wallet.balance) {
      setError('Insufficient balance')
      setLoading(false)
      return
    }

    if (recipientPhone === user.phone) {
      setError('Cannot send money to yourself')
      setLoading(false)
      return
    }

    const result = await sendMoney(wallet.wallet_id, recipientPhone, amountNum, reference)

    if (result.success) {
      setSuccess(true)
      setRecipientPhone('')
      setAmount('')
      setReference('')
      
      // Reload wallet balance
      const { data: walletData } = await getUserWallet(user.user_id)
      if (walletData) {
        setWallet(walletData)
      }

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      setError(result.error || 'Transaction failed')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
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
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Send className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
            <p className="text-sm text-gray-600">Transfer funds to another ClickPay user</p>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            ৳{wallet?.balance?.toLocaleString('en-BD', { minimumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (BDT) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Payment for..."
              maxLength={150}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              Money sent successfully! Redirecting...
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : success ? 'Success!' : 'Send Money'}
          </button>
        </form>
      </div>
    </div>
  )
}
