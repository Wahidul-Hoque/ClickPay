'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserSession } from '@/lib/auth'
import { getUserWallet, getQRCodes } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, QrCode, Plus, Scan } from 'lucide-react'
import QRCodeLib from 'qrcode'

export default function QRPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [qrCodes, setQRCodes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'my-codes' | 'scan'>('my-codes')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [qrType, setQRType] = useState<'static' | 'dynamic'>('static')
  const [fixedAmount, setFixedAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedQR, setGeneratedQR] = useState<string>('')

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
    }

    const { data: qrData } = await getQRCodes(currentUser.user_id)
    if (qrData) {
      setQRCodes(qrData)
    }
  }

  const handleCreateQR = async () => {
    setLoading(true)

    const payload = JSON.stringify({
      walletId: wallet.wallet_id,
      userId: user.user_id,
      type: qrType,
      amount: fixedAmount ? parseFloat(fixedAmount) : null,
      timestamp: Date.now()
    })

    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        owner_user_id: user.user_id,
        owner_wallet_id: wallet.wallet_id,
        qr_type: qrType,
        payload: payload,
        fixed_amount: fixedAmount ? parseFloat(fixedAmount) : null,
        note: note || null,
        status: 'active'
      })
      .select()
      .single()

    if (!error && data) {
      // Generate QR code image
      const qrImage = await QRCodeLib.toDataURL(payload)
      setGeneratedQR(qrImage)
      
      // Reload QR codes
      loadData()
      setShowCreateForm(false)
      setFixedAmount('')
      setNote('')
    }

    setLoading(false)
  }

  const generateQRImage = async (payload: string) => {
    return await QRCodeLib.toDataURL(payload)
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Payments</h1>
              <p className="text-sm text-gray-600">Scan or generate QR codes for payments</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create QR</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('my-codes')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'my-codes'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My QR Codes
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Scan QR
            </button>
          </div>
        </div>

        {/* Create QR Form */}
        {showCreateForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Create New QR Code</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="static"
                      checked={qrType === 'static'}
                      onChange={(e) => setQRType(e.target.value as 'static')}
                      className="mr-2"
                    />
                    <span>Static (Reusable)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="dynamic"
                      checked={qrType === 'dynamic'}
                      onChange={(e) => setQRType(e.target.value as 'dynamic')}
                      className="mr-2"
                    />
                    <span>Dynamic (One-time)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fixed Amount (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Leave empty for variable amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Payment description"
                  maxLength={200}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateQR}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create QR Code'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated QR Display */}
        {generatedQR && (
          <div className="mb-6 p-6 bg-green-50 rounded-xl text-center">
            <h3 className="text-lg font-semibold mb-4 text-green-900">QR Code Generated!</h3>
            <img src={generatedQR} alt="Generated QR" className="mx-auto w-64 h-64" />
            <button
              onClick={() => setGeneratedQR('')}
              className="mt-4 text-green-700 hover:text-green-900"
            >
              Close
            </button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'my-codes' && (
          <div className="space-y-4">
            {qrCodes.length === 0 ? (
              <div className="text-center py-12">
                <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No QR codes yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Create your first QR code
                </button>
              </div>
            ) : (
              qrCodes.map((qr) => (
                <div key={qr.qr_code_id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          qr.qr_type === 'static' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {qr.qr_type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          qr.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {qr.status}
                        </span>
                      </div>
                      {qr.fixed_amount && (
                        <p className="text-lg font-semibold text-gray-900">৳{parseFloat(qr.fixed_amount).toFixed(2)}</p>
                      )}
                      {qr.note && (
                        <p className="text-sm text-gray-600 mt-1">{qr.note}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(qr.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <button
                      onClick={async () => {
                        const img = await generateQRImage(qr.payload)
                        setGeneratedQR(img)
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      View QR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="text-center py-12">
            <Scan className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Scan QR feature requires camera access</p>
            <p className="text-sm text-gray-400">This feature will be available in the mobile app</p>
          </div>
        )}
      </div>
    </div>
  )
}
