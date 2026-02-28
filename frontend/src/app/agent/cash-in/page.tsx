'use client';

import { useState } from 'react';
import { transactionAPI } from '@/lib/api';
import { Download, Hash, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';

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
      const response = await transactionAPI.cashIn({
        userPhone: formData.userPhone,
        amount: parseFloat(formData.amount),
        epin: formData.epin,
      });

      if (response.data.success) {
        setResult(response.data.data);
        setSuccess(true);
        toast.success(`৳${formData.amount} deposited to ${formData.userPhone}!`);
        setFormData({ userPhone: '', amount: '', epin: '' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cash-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash In</h1>
          <p className="text-slate-500 text-sm">Deposit money into a user&apos;s wallet</p>
        </div>
      </div>

      {success && result && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-bold">Cash-in Successful!</p>
          </div>
          <div className="text-sm space-y-1">
            <p>Amount: <span className="font-semibold">৳{result.amount}</span></p>
            <p>To: <span className="font-semibold">{result.to} ({result.to_phone})</span></p>
            <p>Reference: <span className="font-mono text-xs">{result.reference}</span></p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5 shadow-sm border-slate-200">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">User Phone Number</label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              required
              type="text"
              placeholder="01XXXXXXXXX"
              className="input-field pl-10 h-12"
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
              className="input-field pl-10 h-12 text-lg font-semibold"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Your Agent ePin</label>
          <input
            required
            type="password"
            maxLength={5}
            pattern="\d{5}"
            placeholder="•••••"
            className="input-field h-12 text-center text-xl tracking-[0.3em] font-mono"
            value={formData.epin}
            onChange={(e) => setFormData({ ...formData, epin: e.target.value.replace(/\D/g, '') })}
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {loading ? 'Processing...' : 'Deposit to User'}
        </button>
      </form>
    </div>
  );
}