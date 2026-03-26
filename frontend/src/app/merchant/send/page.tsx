'use client';

import { useState } from 'react';
import { Send, Phone, DollarSign, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import { useRouter } from 'next/navigation';
import { merchantAPI } from '@/lib/api';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
export default function MerchantSendMoneyPage() {
  const router = useRouter();
  const toast = useToast();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [epin, setEpin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  const commissionRate = 0.0125; // 1.25%
  const numAmount = parseFloat(amount) || 0;
  const fee = parseFloat((numAmount * commissionRate).toFixed(2));
  const total = numAmount + fee;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    toast.info('Initiating transfer...');

    try {
      const response = await merchantAPI.sendMoney({
        toPhone: recipient,
        amount: numAmount,
        epin: epin
      });

      if (response.data.success) {
        const txResult = response.data.data;
        console.log('Transaction Success:', txResult);
        setResult(txResult);
        setSuccess(true);
        toast.success(`৳${txResult.amount || numAmount} sent successfully!`);
        
        // Reset form
        setRecipient('');
        setAmount('');
        setEpin('');
      } else {
        toast.error(response.data.message || 'Transfer failed');
      }
    } catch (error: any) {
      console.error('Merchant Send Error:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to process transfer';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-6">      
      <div className="w-full max-w-4xl mx-auto space-y-6">

        <div className="mb-4">
          <Link 
            href='/merchant'
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Merchant Dashboard
          </Link>
        </div>
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4 shadow-sm">
            <Send className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Send Money</h1>
          <p className="text-slate-500 mt-2 font-medium">B2B and Customer Settlements with Instant Payout</p>
        </div>

        {/* Info Alert */}
        <div className="flex items-start gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
          <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-700 leading-relaxed font-medium">
            Merchant transfers incur a **1.25% system commission** added to the principal. 
            Ensure your balance covers both the transfer and the fee.
          </p>
        </div>

        {/* Transaction Card */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <form onSubmit={handleSend} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recipient */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Recipient Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="tel"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    pattern="01[3-9]\d{8}"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Transfer Amount (৳)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-lg font-black placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Quick Amount Selector */}
            <div className="grid grid-cols-4 gap-3">
              {[500, 1000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className="py-3 px-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 text-xs font-black hover:border-blue-500 hover:text-blue-600 hover:bg-white transition-all shadow-sm"
                >
                  ৳{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Ledger Preview */}
            <div className="bg-slate-900 rounded-[28px] p-6 text-white space-y-4 shadow-xl">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">Principal Amount</span>
                <span className="font-bold text-lg font-mono">৳{numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">System Fee (1.25%)</span>
                <span className="font-bold text-rose-400 font-mono">+৳{fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-px bg-slate-800 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-black uppercase tracking-widest text-xs">Total Deduction</span>
                <span className="text-2xl font-black font-mono">৳{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Authorization */}
            <div className="space-y-4 max-w-xs mx-auto text-center pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Verify ePin</label>
              <div className="relative">
                <input
                  type="password"
                  value={epin}
                  onChange={(e) => setEpin(e.target.value)}
                  placeholder="•••••"
                  maxLength={5}
                  pattern="\d{5}"
                  className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-center tracking-[1em] font-black text-xl placeholder:text-slate-200"
                  required
                />
              </div>
            </div>

            {/* Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Transfer Funds
                </>
              )}
            </button>
          </form>
        </div>

        {/* Modal */}
        {success && result && (
          <TransactionSummaryModal
            isOpen={success}
            onClose={() => setSuccess(false)}
            title="Merchant Transfer Complete"
            accountLabel="Recipient"
            account={result.to_phone || recipient || 'Recipient'}
            amount={result.amount || numAmount}
            charge={result.fee !== undefined ? result.fee : fee}
            transactionId={result.transaction_id || result.transactionId || 'PENDING'}
            reference={result.reference || 'Merchant Send'}
            time={new Date().toLocaleString()}
          />
        )}
      </div>
    </div>
  );
}
