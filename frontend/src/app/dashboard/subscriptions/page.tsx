'use client';

import { useEffect, useState } from 'react';
import { subscriptionAPI } from '@/lib/api';
import { 
  Calendar, 
  RefreshCw, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  Zap, 
  Loader2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Subscription {
  subscription_id: string;
  plan_name: string;
  amount: number;
  next_billing_at: string;
  auto_renew: boolean;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  merchant_name?: string; // Likely joined from merchant_profiles
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await subscriptionAPI.getMy();
      setSubscriptions(response.data.data);
    } catch (error) {
      console.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'active') {
        await subscriptionAPI.pause(id);
      } else {
        await subscriptionAPI.resume(id);
      }
      fetchSubscriptions(); // Refresh list
    } catch (error) {
      alert('Failed to update subscription status');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await subscriptionAPI.cancel(id);
      fetchSubscriptions();
    } catch (error) {
      alert('Cancellation failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Subscriptions</h1>
          <p className="text-slate-500 text-sm">Manage your recurring payments and automated bills</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
          <Zap className="w-4 h-4" /> Explore Plans
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No active subscriptions</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-1 text-sm">
            Set up recurring payments for utilities, streaming, or premium services.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {subscriptions.map((sub) => (
            <div key={sub.subscription_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{sub.plan_name}</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{sub.merchant_name || 'Service'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900">৳{sub.amount}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Per Month</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Next: {new Date(sub.next_billing_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-xs font-bold capitalize text-slate-700">{sub.status}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleToggleStatus(sub.subscription_id, sub.status)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {sub.status === 'active' ? (
                    <><PauseCircle className="w-4 h-4 text-amber-500" /> Pause</>
                  ) : (
                    <><PlayCircle className="w-4 h-4 text-emerald-500" /> Resume</>
                  )}
                </button>
                <button 
                  onClick={() => handleCancel(sub.subscription_id)}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-rose-100 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card for Automated Logic */}
      <div className="bg-indigo-700 rounded-3xl p-6 text-white flex items-center gap-6 shadow-glow-indigo">
        <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center shrink-0">
          <Zap className="w-8 h-8 text-indigo-300" />
        </div>
        <div>   
          <p className="text-white text-sm mt-1 opacity-80">
            Ensure your wallet has sufficient balance before the <strong>Next Billing Date</strong>. Our system will automatically process the payment and notify you via SMS/Email.
          </p>
        </div>
      </div>
    </div>
  );
}