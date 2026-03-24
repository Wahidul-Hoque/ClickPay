'use client';

import { useEffect, useState } from 'react';
import { savingsAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import { 
  PiggyBank, TrendingUp, AlertTriangle, 
  Loader2, Lock, Unlock, Calendar, History 
} from 'lucide-react';

// 1. Interface matching backend statuses
interface SavingsAccount {
  id: number;
  principal_amount: string;
  interest_rate: string;
  finish_at: string;
  status: 'active' | 'closed' | 'broken'; 
  created_at: string;
}

export default function SavingsPage() {
  const { success, error, warning } = useToast(); 
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(3); 
  const [epin, setEpin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const res = await savingsAPI.getAccounts();
      // Ensure we are grabbing the array correctly from the controller
      setAccounts(res.data.data || res.data); 
    } catch (err: any) {
      error("Failed to load savings");
    } finally {
      setLoading(false);
    }
  };

  // Logic: Only one active account allowed
  const activeAccount = accounts?.find(a => a.status === 'active');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await savingsAPI.create({
        amount: parseFloat(amount),
        durationMonths: duration,
        epin
      });
      success('Fixed Savings Started!');
      setAmount('');
      setEpin('');
      setShowConfirm(false);
      fetchSavings();
    } catch (err: any) {
      error(err.response?.data?.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBreak = async (id: number) => {
    if (!confirm('Break early? You will get 0% interest.')) return;
    try {
      const res = await savingsAPI.break(id);
      success(`Account closed. Received: ৳${res.data.data.principal}`);
      fetchSavings();
    } catch (err: any) {
      error('Failed to close account');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 pb-20">
      <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fixed Savings</h1>
          <p className="opacity-90">Secure 7% Annual Interest</p>
        </div>
        <PiggyBank className="w-12 h-12 opacity-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeAccount ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-indigo-100">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500 rounded-2xl text-white">
                    <Lock size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Active Deposit</h2>
                </div>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">ACTIVE</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Principal</p>
                  <p className="text-2xl font-black text-slate-800">৳{parseFloat(activeAccount.principal_amount).toLocaleString()}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-700">
                  <p className="text-xs uppercase font-bold">Interest Rate</p>
                  <p className="text-2xl font-black">7.00%</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Calendar size={18} />
                  <span>Matures: {new Date(activeAccount.finish_at).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => handleBreak(activeAccount.id)}
                  className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <Unlock size={18} /> Break Early
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6 text-slate-800">New Savings Plan</h2>
              <form onSubmit={(e) => { e.preventDefault(); setShowConfirm(true); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Amount (Min ৳500)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-2xl font-bold focus:ring-2 focus:ring-emerald-500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Duration</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[3, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDuration(m)}
                        className={`py-3 rounded-xl font-bold border-2 transition-all ${
                          duration === m ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400'
                        }`}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-800 transition-all">
                  Initialize Plan
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 px-2">
            <History size={18} /> History
          </h3>
          <div className="space-y-3">
            {accounts.filter(a => a.status !== 'active').map((acc) => (
              <div key={acc.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-700">৳{parseFloat(acc.principal_amount).toFixed(0)}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{acc.status}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-500 font-medium">{new Date(acc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-6">Confirm Setup</h3>
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-slate-600"><span>Principal</span><span className="font-bold text-slate-900">৳{amount}</span></div>
              <div className="flex justify-between text-slate-600"><span>Term</span><span className="font-bold text-slate-900">{duration} Months</span></div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="password"
                maxLength={5}
                placeholder="5-Digit ePin"
                className="w-full p-4 bg-slate-50 rounded-2xl text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-emerald-500 border-none"
                value={epin}
                onChange={(e) => setEpin(e.target.value.replace(/\D/g, ''))}
                required
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowConfirm(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-emerald-600 text-white font-bold rounded-xl">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}