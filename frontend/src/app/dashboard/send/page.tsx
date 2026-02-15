'use client';

import { useState } from 'react';
import { Send, Phone, DollarSign, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import { useRouter } from 'next/navigation';

export default function SendMoneyPage() {
  const router = useRouter();
  const toast = useToast();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [epin, setEpin] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Show loading info
    toast.info('Processing transaction...');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ toPhone: recipient, amount, epin, note })
      // });

      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate success or error randomly for demo
          const success = Math.random() > 0.3; // 70% success rate
          if (success) {
            resolve({ success: true });
          } else {
            reject(new Error('Insufficient balance'));
          }
        }, 2000);
      });

      // Success
      toast.success(`৳${amount} sent successfully to ${recipient}!`);

      // Reset form
      setRecipient('');
      setAmount('');
      setEpin('');
      setNote('');

      // Optional: Navigate after delay
      setTimeout(() => {
        toast.info('Check your transaction history for details');
      }, 1500);

    } catch (error: any) {
      console.error('Send money error:', error);
      toast.error(error.message || 'Failed to send money. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Send className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Send Money</h1>
          <p className="text-gray-600 mt-2">Transfer money to anyone instantly</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSend} className="space-y-6">
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  pattern="01[3-9]\d{8}"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (BDT) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-semibold"
                  required
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-primary-50 hover:border-primary-500 transition-colors text-sm font-medium"
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* ePin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ePin (5 digits) *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={epin}
                  onChange={(e) => setEpin(e.target.value)}
                  placeholder="•••••"
                  maxLength={5}
                  pattern="\d{5}"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent tracking-widest text-center text-lg"
                  required
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note or reference..."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Transaction Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-lg">৳{amount || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Fee</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="border-t border-gray-300 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-2xl text-primary-600">
                  ৳{amount || '0.00'}
                </span>
              </div>
            </div>

            {/* Info Alert */}
            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Make sure the recipient's phone number is correct. Transaction cannot be reversed once completed.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Money</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}