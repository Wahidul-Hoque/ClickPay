'use client';

import { useState, useEffect } from 'react';
import { subscriptionAPI } from '@/lib/api';
import { Calendar, CreditCard, Power, PauseCircle, PlayCircle, XCircle, RefreshCw, Plus } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import Link from 'next/link';

export default function MySubscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await subscriptionAPI.getSubscriptions();
      setSubs(res.data.data);
    } catch (err) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await subscriptionAPI.updateStatus(id, newStatus);
      toast.success(`Subscription ${newStatus}`);
      fetchSubscriptions(); // Refresh list
    } catch (err) {
      toast.error('Failed to update subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      paused: 'bg-amber-100 text-amber-700 border-amber-200',
      cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
      expired: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Subscriptions</h1>
          <p className="text-slate-500 text-sm">Manage your monthly recurring payments</p>
        </div>
        <Link href="/dashboard/subscriptions/discover" className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Service
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : subs.length === 0 ? (
        <div className="text-center py-20 card border-dashed border-2 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">No Active Subscriptions</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">You haven't subscribed to any services yet.</p>
          <Link href="/dashboard/subscriptions/discover" className="btn btn-secondary">
            Browse Merchants
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subs.map((sub) => (
            <div key={sub.subscription_id} className="card group hover:shadow-lg transition-all border-l-4 border-l-primary-500">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-primary-600">
                  {sub.merchant_name.charAt(0)}
                </div>
                {getStatusBadge(sub.status)}
              </div>

              <h3 className="font-bold text-slate-900 text-lg leading-tight">{sub.merchant_name}</h3>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-0.5">{sub.plan_name}</p>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly Price</p>
                  <p className="text-xl font-black text-slate-900">৳{parseFloat(sub.amount).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Next Billing</p>
                  <p className="text-xs font-bold text-slate-700">
                    {new Date(sub.next_billing_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2">
                {sub.status === 'active' ? (
                  <>
                    <button 
                      onClick={() => handleStatusUpdate(sub.subscription_id, 'paused')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                    >
                      <PauseCircle className="w-3.5 h-3.5" /> Pause
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(sub.subscription_id, 'cancelled')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleStatusUpdate(sub.subscription_id, 'active')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Resume Subscription
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}