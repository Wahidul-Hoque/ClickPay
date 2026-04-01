'use client';

import { useEffect, useState } from 'react';
import { subscriptionAPI } from '@/lib/api'; // Ensure this exists in your api.ts
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
  Plus
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
  const [epin, setEpin] = useState('');

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
      toast.success(`Subscribed to ${showPayModal.merchant_name}`);
      setShowPayModal(null);
      setEpin('');
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
      
      {/* ── Section 1: My Subscriptions ──────────────── */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="text-emerald-500" /> My Subscriptions
        </h2>
        {mySubs.length === 0 ? (
          <div className="card bg-slate-50 border-dashed border-2 flex flex-col items-center py-10 text-slate-500">
            <Tv className="w-12 h-12 mb-2 opacity-20" />
            <p>You have no active subscriptions.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {mySubs.map((sub) => (
              <div key={sub.subscription_id} className="card flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
                    <Tv className="text-primary-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{sub.merchant_name}</h3>
                    <p className="text-sm text-slate-500">৳{parseFloat(sub.amount).toFixed(0)}/month • Next bill: {new Date(sub.next_billing_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Auto-Renew</span>
                    <button 
                      onClick={() => handleToggleRenew(sub.subscription_id)}
                      className="transition-transform active:scale-90"
                    >
                      {sub.auto_renew ? (
                        <ToggleRight className="w-10 h-10 text-primary-600" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-slate-300" />
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
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Available Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {available.map((merchant) => (
            <div key={merchant.merchant_user_id} className="card flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-primary-50 transition-colors">
                  <Play className="w-6 h-6 text-slate-600 group-hover:text-primary-600" />
                </div>
                <span className="text-lg font-bold text-primary-600">৳300 <small className="text-slate-400 font-normal">/mo</small></span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{merchant.merchant_name}</h3>
                <p className="text-sm text-slate-500 mb-4">{merchant.business_type || 'Premium Streaming Content'}</p>
                <button 
                  onClick={() => setShowPayModal(merchant)}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Subscribe Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subscription Modal ───────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleIn">
            <h3 className="text-2xl font-bold text-center mb-2">Confirm Subscription</h3>
            <p className="text-center text-slate-500 mb-6">
              You are subscribing to <span className="font-bold text-slate-800">{showPayModal.merchant_name}</span>. 
              ৳300.00 will be deducted from your wallet.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">Enter 5-Digit ePin</label>
                <div className="relative max-w-[200px] mx-auto">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    autoFocus
                    required
                    type="password"
                    maxLength={5}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-[0.3em] font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                    value={epin}
                    onChange={(e) => setEpin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowPayModal(null)}
                  className="flex-1 px-4 py-3 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={subscribing || epin.length !== 5}
                  className="flex-[2] btn btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {subscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  Confirm & Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}