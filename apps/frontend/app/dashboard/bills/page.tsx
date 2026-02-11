'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserSession } from '@/lib/auth'
import { getUserWallet, getBillers, getBillPayments } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Receipt, Zap, Droplet, Wifi, Phone as PhoneIcon } from 'lucide-react'

export default function BillsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [billers, setBillers] = useState<any[]>([])
  const [billPayments, setBillPayments] = useState<any[]>([])
  const [selectedBiller, setSelectedBiller] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const currentUser = getUserSession()
    if (!currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)

    const { data: walletData } = await getUserWallet(currentUser.user_id)
    if (walletData) {
      setWallet(walletData)
      
      const { data: paymentsData } = await getBillPayments(walletData.wallet_id)
      if (paymentsData) {
        setBillPayments(paymentsData)
      }
    }

    const { data: billersData } = await getBillers()
    if (billersData) {
      setBillers(billersData)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'electricity':
        return Zap
      case 'water':
        return Droplet
      case 'internet':
        return Wifi
      case 'mobile':
        return PhoneIcon
      default:
        return Receipt
    }
  }

  const handlePayBill = async () => {
    setError('')
    setSuccess(false)
    setLoading(true)

    if (!selectedBiller || !amount || !accountNumber) {
      setError('Please fill in all fields')
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

    // Create bill payment
    const { data, error: paymentError } = await supabase
      .from('bill_payments')
      .insert({
        wallet_id: wallet.wallet_id,
        biller_id: selectedBiller.biller_id,
        amount: amountNum,
        provider_reference: accountNumber,
        status: 'completed'
      })
      .select()
      .single()

    if (paymentError) {
      setError('Payment failed')
      setLoading(false)
      return
    }

    // Update wallet balance
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - amountNum })
      .eq('wallet_id', wallet.wallet_id)

    setSuccess(true)
    setAmount('')
    setAccountNumber('')
    setSelectedBiller(null)

    setTimeout(() => {
      loadData()
      setSuccess(false)
    }, 2000)

    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
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
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Receipt className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pay Bills</h1>
            <p className="text-sm text-gray-600">Pay utility bills and services</p>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            ৳{wallet?.balance?.toLocaleString('en-BD', { minimumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>

        {/* Select Biller */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Biller</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {billers.map((biller) => {
              const Icon = getCategoryIcon(biller.category)
              return (
                <button
                  key={biller.biller_id}
                  onClick={() => setSelectedBiller(biller)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedBiller?.biller_id === biller.biller_id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${
                    selectedBiller?.biller_id === biller.biller_id ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  <p className="text-sm font-medium text-center">{biller.name}</p>
                  <p className="text-xs text-gray-500 text-center capitalize">{biller.category}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Payment Form */}
        {selectedBiller && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account/Customer Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (BDT)
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                Bill payment successful!
              </div>
            )}

            <button
              onClick={handlePayBill}
              disabled={loading || success}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : 'Pay Bill'}
            </button>
          </div>
        )}

        {/* Recent Bill Payments */}
        {billPayments.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
            <div className="space-y-3">
              {billPayments.slice(0, 5).map((payment) => (
                <div key={payment.bill_payment_id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.biller?.name}</p>
                    <p className="text-sm text-gray-600">{payment.provider_reference}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">৳{parseFloat(payment.amount).toFixed(2)}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
