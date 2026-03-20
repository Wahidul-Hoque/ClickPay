'use client';

import { useState, useEffect } from 'react';
import { Download, Phone, DollarSign, Lock, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import { useRouter } from 'next/navigation';
import { transactionAPI, walletAPI } from '@/lib/api';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';

export default function CashoutPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [agentPhone, setAgentPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [epin, setEpin] = useState('');
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fee constants
  const FEE_PERCENT = 0.015; // 1.5% total

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await walletAPI.getBalance();
      if (response.data.success) {
        setBalance(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch balance');
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const totalFee = numAmount * FEE_PERCENT;
  const totalDeduction = numAmount + totalFee;
  const maxCashoutPossible = balance / (1 + FEE_PERCENT);

  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (totalDeduction > balance) {
      toast.error('Insufficient balance including 1.5% fee.');
      return;
    }

    setLoading(true);
    toast.info('Processing cashout...');

    try {
      const response = await transactionAPI.cashOut({
        agentPhone: agentPhone,
        amount: numAmount,
        epin: epin
      });

      if (response.data.success) {
        setResult(response.data.data);
        setSuccess(true);
        toast.success(`৳${numAmount} cashed out successfully!`);
        
        // Reset form
        setAgentPhone('');
        setAmount('');
        setEpin('');
      }
    } catch (error: any) {
      console.error('Cashout error:', error);
      toast.error(error.response?.data?.message || 'Failed to process cashout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">

        {/* Summary Modal */}
        {success && result && (
          <TransactionSummaryModal
            isOpen={success}
            onClose={() => {
              setSuccess(false);
              router.push('/dashboard');
            }}
            title="Cashout Successful"
            accountLabel="Agent Number"
            account={agentPhone}
            amount={result.amount || numAmount}
            charge={result.fee || totalFee.toFixed(2)}
            transactionId={result.transaction_id || result.reference || ''}
            reference="Agent Withdrawal"
            time={result.date ? new Date(result.date).toLocaleString('en-GB') : undefined}
          />
        )}

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 indigo-100 rounded-full mb-4 shadow-sm">
            <Download className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cash Out</h1>
          <p className="text-gray-600 mt-2">Withdraw money instantly via an Agent</p>
        </div>

        {/* Form Card */}
        <div className="card shadow-xl border-t-4 border-indigo-500">
          <form onSubmit={handleCashout} className="space-y-6">
            
            {/* Agent Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agent Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Withdraw Amount (BDT) *
                </label>
                <span className="text-xs font-medium text-gray-500">
                  Balance: ৳{balance.toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="10"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-bold outline-none transition-all"
                  required
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className="py-2 px-4 border border-gray-200 rounded-lg hover:indigo-50 hover:border-indigo-500 hover:text-indigo-600 transition-all text-sm font-semibold text-gray-600"
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* ePin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm 5-Digit ePin *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={epin}
                  onChange={(e) => setEpin(e.target.value)}
                  placeholder="•••••"
                  maxLength={5}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent tracking-[1em] text-center text-lg font-bold outline-none"
                  required
                />
              </div>
            </div>

            {/* Transaction Summary Box */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Withdrawal Amount</span>
                <span className="font-semibold text-slate-800">৳{numAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>Cashout Fee (1.5%)</span>
                </div>
                <span className="font-semibold text-rose-600">৳{totalFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Deduction</span>
                <span className={`font-bold text-2xl ${totalDeduction > balance ? 'text-rose-600' : 'text-slate-900'}`}>
                  ৳{totalDeduction.toFixed(2)}
                </span>
              </div>
              {numAmount > 0 && totalDeduction > balance && (
                <p className="text-[11px] text-rose-500 font-medium text-right animate-pulse">
                  Exceeds available balance
                </p>
              )}
            </div>

            {/* Info Alert */}
            <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-snug">
                You are about to cash out from your account. Please ensure the Agent phone number is correct before confirming.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !amount || totalDeduction > balance}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Withdrawal...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  <span>Confirm Cashout</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-400">
          Maximum cashout with current balance: <span className="font-semibold">৳{maxCashoutPossible.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}