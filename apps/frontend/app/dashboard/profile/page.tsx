'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserSession } from '@/lib/auth'
import { getUserWallet } from '@/lib/database'
import { ArrowLeft, User, Phone, CreditCard, Shield, Wallet } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
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
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-600">Manage your account information</p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Account Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-base font-medium text-gray-900">{user?.name}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="text-base font-medium text-gray-900">{user?.phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Account Role</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-base font-medium text-gray-900 capitalize">{user?.role}</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      user?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user?.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="text-base font-medium text-gray-900">#{user?.user_id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Information</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-primary-700">Current Balance</p>
                  <p className="text-2xl font-bold text-primary-900">
                    ৳{wallet?.balance?.toLocaleString('en-BD', { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-primary-600 capitalize">
                      {wallet?.wallet_type} Wallet
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      wallet?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {wallet?.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Wallet ID</p>
                <p className="text-base font-medium text-gray-900">#{wallet?.wallet_id}</p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
            <button className="w-full p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-gray-900">Change ePin</p>
                  <p className="text-sm text-gray-600 mt-1">Update your account security PIN</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
