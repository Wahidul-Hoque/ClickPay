'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Calendar, CreditCard, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { merchantAPI, subscriptionAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';

export default function NewSubscription() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get('merchantId');
  const router = useRouter();
  const toast = useToast();

  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [epin, setEpin] = useState('');
  const [plan, setPlan] = useState({ name: 'Premium Plan', price: 500 }); // Default example plan

  useEffect(() => {
    if (merchantId) fetchMerchant();
  }, [merchantId]);

  const fetchMerchant = async () => {
    try {
      const res = await merchantAPI.getMerchantDetails(merchantId!);
      setMerchant(res.data.data);
    } catch (err) {
      toast.error('Merchant not found');
      router.push('/dashboard/subscriptions/discover');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await subscriptionAPI.subscribe({
        merchantId: merchantId!,
        planName: plan.name,
        amount: plan.price,
        epin: epin
      });
      toast.success(`Subscribed to ${merchant.merchant_name}!`);
      router.push('/dashboard/subscriptions');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Preparing your subscription...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col lg:flex-row gap-8">
      {/* Left: Merchant Info */}
      <div className="flex-1 space-y-6">
        <div className="card bg-gradient-to-br from-primary-600 to-indigo-700 text-white border-none shadow-xl p-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">
            {merchant.merchant_name.charAt(0)}
          </div>
          <h1 className="text-3xl font-bold">{merchant.merchant_name}</h1>
          <p className="text-white/80 mt-2">{merchant.business_type} • {merchant.category}</p>
          
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-5 h-5 opacity-70" />
              <span>Billing Cycle: Every 30 Days</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="w-5 h-5 opacity-70" />
              <span>Secure Auto-Pay enabled</span>
            </div>
          </div>
        </div>

        <div className="card bg-white space-y-4">
          <h2 className="font-bold text-slate-900 text-lg">About recurring payments</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            By subscribing, you authorize <strong>ClickPay</strong> to automatically deduct <strong>৳{plan.price}</strong> 
            every month from your wallet. You can cancel at any time from your subscription dashboard.
          </p>
        </div>
      </div>

      {/* Right: Checkout Form */}
      <div className="w-full lg:w-[400px]">
        <div className="card shadow-2xl sticky top-24 border-t-4 border-primary-600">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Confirm Subscription</h2>
          
          <form onSubmit={handleSubscribe} className="space-y-6">
            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
              <p className="text-xs text-primary-600 font-bold uppercase tracking-wider mb-1">Selected Plan</p>
              <div className="flex justify-between items-end">
                <span className="font-bold text-slate-800">{plan.name}</span>
                <div className="text-right">
                   <span className="text-2xl font-black text-primary-700">৳{plan.price}</span>
                   <span className="text-xs text-slate-500 block">/month</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Enter 5-Digit ePin</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password"
                  required
                  maxLength={5}
                  placeholder="•••••"
                  className="input-field pl-10 tracking-[0.5em] text-center font-bold"
                  value={epin}
                  onChange={(e) => setEpin(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || epin.length < 5}
              className="btn btn-primary w-full py-4 flex items-center justify-center gap-3 text-lg font-bold shadow-lg shadow-primary-200 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
            >
              {submitting ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Subscribe Now <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Verified Merchant Payment
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}