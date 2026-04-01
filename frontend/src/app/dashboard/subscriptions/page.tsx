'use client';

import { useEffect, useState } from 'react';
import { subscriptionAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import {
  Play, 
  Pause, 
  RefreshCw, 
  CreditCard, 
  Loader2, 
  Lock, 
  Tv, 
  CheckCircle2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Plus,
  ArrowLeft,
  Calendar,
  Zap
} from 'lucide-react';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';

// ── Types ────────────────────────────────────────────
interface Subscription {
  subscription_id: number;
  merchant_name: string;
  plan_name: string;
  amount: string;
  next_billing_at: string;
  auto_renew: boolean;
  status: string;
}

interface Merchant {
  merchant_user_id: number;
  merchant_name: string;
  business_type: string;
}

export default function SubscriptionsPage() {
  const toast = useToast();
  const [mySubs, setMySubs] = useState<Subscription[]>([]);
  const [available, setAvailable] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [showPayModal, setShowPayModal] = useState<Merchant | null>(null);
  const [modalStep, setModalStep] = useState(1); // 1: Details, 2: ePin
  const [epin, setEpin] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await subscriptionAPI.getDashboard();
      setMySubs(res.data.data.mySubscriptions || []);
      setAvailable(res.data.data.availableMerchants || []);
    } catch (err: any) {
      toast.error('Failed to load subscriptions');
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRenew = async (subId: number) => {
    try {
      await subscriptionAPI.toggleRenew(subId);
      toast.success('Auto-renewal updated');
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;
    setSubscribing(true);

    try {
      const res = await subscriptionAPI.subscribe({
        merchantUserId: showPayModal.merchant_user_id,
        epin
      });
      setSuccessData({
        merchant_name: showPayModal.merchant_name,
        amount: 300,
        transaction_id: res.data.data?.subscription_id || 'SUB-' + Date.now()
      });
      toast.success(`Subscribed to ${showPayModal.merchant_name}`);
      setShowPayModal(null);
      setEpin('');
      setModalStep(1);
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Subscription failed');
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <p className="mt-4 text-slate-500">Loading your subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Success Modal */}
      {successData && (
        <TransactionSummaryModal
          isOpen={true}
          onClose={() => setSuccessData(null)}
          title="Subscription Successful"
          accountLabel="Platform"
          account={successData.merchant_name}
          amount={successData.amount}
          charge="0.00"
          transactionId={successData.transaction_id}
          reference="Monthly Subscription"
          time={new Date().toLocaleString()}
        />
      )}

      {/* ── Section 1: My Subscriptions ──────────────── */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="text-emerald-500" /> My Subscriptions
        </h2>
        {mySubs.length === 0 ? (
          <div className="card bg-slate-50 border-dashed border-2 flex flex-col items-center py-10 text-slate-500 rounded-[2rem]">
            <Tv className="w-12 h-12 mb-2 opacity-20" />
            <p className="font-semibold">You have no active subscriptions.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {mySubs.map((sub) => (
              <div key={sub.subscription_id} className="card flex items-center justify-between hover:shadow-lg transition-all rounded-[2rem] p-6 border-slate-100 hover:border-primary-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <Zap className="text-primary-600 w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{sub.merchant_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                       <span className="font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded text-xs">৳{parseFloat(sub.amount).toFixed(0)}/mo</span>
                       <span className="flex items-center gap-1"><Calendar size={14} /> Next: {new Date(sub.next_billing_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Auto-Renew</span>
                    <button 
                      onClick={() => handleToggleRenew(sub.subscription_id)}
                      className="transition-transform active:scale-95"
                    >
                      {sub.auto_renew ? (
                        <div className="w-12 h-6 bg-emerald-500 rounded-full relative transition-colors shadow-inner flex items-center px-1">
                           <div className="w-4 h-4 bg-white rounded-full translate-x-6 transition-transform shadow-md" />
                        </div>
                      ) : (
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative transition-colors shadow-inner flex items-center px-1">
                           <div className="w-4 h-4 bg-white rounded-full transition-transform shadow-md" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: Available Options ─────────────── */}
      <section>
        <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tighter">Available Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {available.map((merchant) => (
            <div key={merchant.merchant_user_id} className="card flex flex-col justify-between group rounded-[2.5rem] p-8 hover:shadow-2xl hover:-translate-y-1 transition-all border-slate-100 overflow-hidden relative">
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Play size={140} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl group-hover:bg-primary-50 transition-all flex items-center justify-center">
                    <Play className="w-7 h-7 text-slate-600 group-hover:text-primary-600 fill-current" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary-600 tracking-tighter">৳300</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">per month</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{merchant.merchant_name}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-8 max-w-[200px]">{merchant.business_type || 'Premium Streaming Content & Digital Services'}</p>
                  <button 
                    onClick={() => {
                        setShowPayModal(merchant);
                        setModalStep(1);
                        setEpin('');
                    }}
                    className="w-full btn btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest bg-slate-900 border-none hover:bg-primary-600 group-hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" /> Subscribe Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Multi-Step Subscription Modal ─────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-scaleIn relative overflow-hidden">
            {/* Modal Corner Accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-50 rounded-full opacity-50" />
            
            <div className="relative z-10">
              {modalStep === 1 ? (
                <div className="animate-fadeIn">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 text-center uppercase">Confirm</h3>
                    <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Platform</span>
                            <span className="font-black text-slate-900">{showPayModal.merchant_name}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Plan</span>
                            <span className="font-black text-primary-600">Premium Monthly</span>
                        </div>
                        <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                             <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Total Pay</span>
                             <span className="text-3xl font-black text-slate-900">৳300.00</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                          onClick={() => setModalStep(2)}
                          className="w-full btn btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-600/20"
                        >
                          Next Step
                        </button>
                        <button 
                          onClick={() => setShowPayModal(null)}
                          className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                    </div>
                </div>
              ) : (
                <div className="animate-fadeIn">
                    <button onClick={() => setModalStep(1)} className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-widest mb-4 hover:underline">
                        <ArrowLeft size={12} /> Back
                    </button>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-8 text-center uppercase">Verify ePin</h3>
                    
                    <form onSubmit={handleSubscribe} className="space-y-8">
                        <div>
                            <div className="relative max-w-[200px] mx-auto group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 transition-colors group-focus-within:text-primary-500" />
                                <input
                                    autoFocus
                                    required
                                    type="password"
                                    maxLength={5}
                                    placeholder="•••••"
                                    className="w-full pl-10 pr-4 py-4 border-2 border-slate-100 rounded-2xl text-center text-3xl tracking-[0.4em] font-mono focus:border-primary-500 focus:ring-0 outline-none transition-all"
                                    value={epin}
                                    onChange={(e) => setEpin(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Enter your 5-digit security pin</p>
                        </div>

                        <button 
                          type="submit"
                          disabled={subscribing || epin.length !== 5}
                          className="w-full btn btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-[0_15px_30px_-5px_rgba(var(--primary-600-rgb),0.3)] transition-all active:scale-95 disabled:grayscale"
                        >
                          {subscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          {subscribing ? 'Processing...' : 'Subscribe & Pay'}
                        </button>
                    </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}