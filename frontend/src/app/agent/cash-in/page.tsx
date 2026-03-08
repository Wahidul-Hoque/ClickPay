'use client';

import { useState } from 'react';
import { Download, Hash, Loader2, CheckCircle2, User, ArrowRight } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import api from '@/lib/api'; // Standard axios instance
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';

export default function CashInPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    userPhone: '',
    amount: '',
    epin: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Calling the new backend endpoint we created
      const response = await api.post('/agent/cash-in', {
        userPhone: formData.userPhone,
        amount: parseFloat(formData.amount),
        epin: formData.epin,
      });

      if (response.data.success) {
        setResult(response.data.data);
        setSuccess(true);
        toast.success(`৳${formData.amount} deposited successfully!`);
        // Clear ePin only for security, keep phone/amount in result view
        setFormData({ userPhone: '', amount: '', epin: '' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cash-in failed. Please check user phone and ePin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash In</h1>
          <p className="text-slate-500 text-sm">Transfer money from your agent wallet to a user</p>
        </div>
      </div>

      {/* Success Summary Modal */}
      {success && result && (
        <TransactionSummaryModal
          isOpen={success}
          onClose={() => setSuccess(false)}
          title="Cash In Successful"
          accountLabel="User Phone"
          account={result.to_phone || result.phone || formData.userPhone}
          amount={result.amount || result.amount_sent || formData.amount}
          charge={result.charge || '0.00'}
          transactionId={result.transaction_id || ''}
          reference={result.reference || 'Agent Deposit'}
          time={result.created_at ? new Date(result.created_at).toLocaleString('en-GB') : undefined}
        />
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">User Phone Number</label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              required
              type="text"
              placeholder="01XXXXXXXXX"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.userPhone}
              onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (৳)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
            <input
              required
              type="number"
              min="1"
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-semibold"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm with Agent ePin</label>
          <input
            required
            type="password"
            maxLength={5}
            pattern="\d{5}"
            placeholder="•••••"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-2xl tracking-[0.5em] font-mono"
            value={formData.epin}
            onChange={(e) => setFormData({ ...formData, epin: e.target.value.replace(/\D/g, '') })}
          />
          <p className="text-[10px] text-slate-400 text-center mt-2 italic">Enter your 5-digit security PIN to authorize this transfer</p>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Download className="w-5 h-5" />
              Confirm Cash In
            </>
          )}
        </button>
      </form>

      {/* Helpful Tips */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h4 className="text-sm font-bold text-blue-800 mb-1">Agent Instructions:</h4>
        <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
          <li>Verify the user's phone number twice before confirming.</li>
          <li>Ensure you have collected the physical cash from the user.</li>
          <li>Cash-in transactions are non-reversible.</li>
        </ul>
      </div>
    </div>
  );
}