'use client';

import { useEffect, useState } from 'react';
import { savingsAPI, systemAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import { 
  PiggyBank, TrendingUp, AlertTriangle, 
  Loader2, Lock, Unlock, Calendar, History, X 
} from 'lucide-react';

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
  const [isBreaking, setIsBreaking] = useState(false);
  const [showBreakConfirm, setShowBreakConfirm] = useState(false);
  const [interestRate, setInterestRate] = useState<number>(0.07); // Default fallback

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const res = await savingsAPI.getAccounts();
      setAccounts(res.data.data || res.data); 

      const settingsRes = await systemAPI.getSettings();
      if (settingsRes.data.success) {
        if (settingsRes.data.settings.savings_interest_rate) {
          setInterestRate(settingsRes.data.settings.savings_interest_rate);
        }
      }
    } catch (err: any) {
      error("Failed to load savings");
    } finally {
      setLoading(false);
    }
  };

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

  const handleBreakAccount = async (id: number) => {
    setIsBreaking(true);  
    try {
      const res = await savingsAPI.break(id);
      success(`Success! ৳${res.data.data.principal} returned to wallet.`);
      setShowBreakConfirm(false);
      fetchSavings();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to close account');
    } finally {
      setIsBreaking(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 pb-20">
      {/* Header Section */}
      <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fixed Savings</h1>
          <p className="opacity-90">Secure {(interestRate * 100).toFixed(0)}% Annual Interest</p>
        </div>
        <PiggyBank className="w-12 h-12 opacity-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeAccount ? (
            /* ACTIVE ACCOUNT CARD */
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-indigo-100">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500 rounded-2xl text-white">
                    <Lock size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Active Deposit</h2>
                </div>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">Principal</p>
                  <p className="text-2xl font-black text-slate-800">৳{parseFloat(activeAccount.principal_amount).toLocaleString()}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-700">
                  <p className="text-xs uppercase font-bold">Interest Rate</p>
                  <p className="text-2xl font-black">{(parseFloat(activeAccount.interest_rate) * 100).toFixed(2)}%</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600 font-medium px-2">
                  <Calendar size={18} className="text-indigo-500" />
                  <span>Matures: {new Date(activeAccount.finish_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
                {/* THIS BUTTON NOW TRIGGERS THE MODAL INSTEAD OF BREAKING DIRECTLY */}
                <button 
                  onClick={() => setShowBreakConfirm(true)}
                  className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <Unlock size={18} /> Break Early
                </button>
              </div>
            </div>
          ) : (
            /* CREATE SAVINGS FORM */
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6 text-slate-800">New Savings Plan</h2>
              <form onSubmit={(e) => { e.preventDefault(); setShowConfirm(true); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Amount (Min ৳500)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-2xl font-bold focus:ring-2 focus:ring-indigo-500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
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
                          duration === m ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'
                        }`}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                  Initialize Plan
                </button>
              </form>
            </div>
          )}
        </div>

        {/* HISTORY SECTION */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 px-2">
            <History size={18} /> History
          </h3>
          <div className="space-y-3">
            {accounts.filter(a => a.status !== 'active').length > 0 ? (
              accounts.filter(a => a.status !== 'active').map((acc) => (
                <div key={acc.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center transition-hover hover:border-indigo-200">
                  <div>
                    <p className="font-bold text-slate-700">৳{parseFloat(acc.principal_amount).toLocaleString()}</p>
                    <p className={`text-[10px] font-black uppercase tracking-tighter ${acc.status === 'closed' ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {acc.status}
                    </p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs text-slate-400 font-medium">{new Date(acc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 text-sm py-10">No history yet</p>
            )}
          </div>
        </div>
      </div>

      {/* CREATE CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-center mb-6">Confirm Setup</h3>
            <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-2xl">
              <div className="flex justify-between text-slate-600 text-sm"><span>Principal</span><span className="font-bold text-slate-900">৳{amount}</span></div>
              <div className="flex justify-between text-slate-600 text-sm"><span>Term</span><span className="font-bold text-slate-900">{duration} Months</span></div>
              <div className="flex justify-between text-slate-600 text-sm"><span>Interest</span><span className="font-bold text-emerald-600">{(interestRate * 100).toFixed(2)}%</span></div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="password"
                maxLength={5}
                placeholder="5-Digit ePin"
                className="w-full p-4 bg-slate-50 rounded-2xl text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-indigo-500 border-none"
                value={epin}
                onChange={(e) => setEpin(e.target.value.replace(/\D/g, ''))}
                required
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowConfirm(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM BREAK CONFIRMATION MODAL */}
      {showBreakConfirm && activeAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="bg-red-50 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-2">Are you sure?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Breaking this account before maturity will result in <span className="text-red-600 font-bold underline">0% interest earned</span>. You will only receive your principal amount (৳{parseFloat(activeAccount.principal_amount).toLocaleString()}).
              </p>

              <div className="flex flex-col gap-3">
                <button
                  disabled={isBreaking}
                  onClick={() => handleBreakAccount(activeAccount.id)}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center shadow-lg active:scale-95"
                >
                  {isBreaking ? <Loader2 className="animate-spin" /> : "Yes, Break Early"}
                </button>
                
                <button
                  disabled={isBreaking}
                  onClick={() => setShowBreakConfirm(false)}
                  className="w-full py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel, Keep Saving
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}