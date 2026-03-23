'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { merchantAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import { 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  CreditCard,
  Zap,
  Clock
} from 'lucide-react';

export default function MerchantSubscriptionPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, setAuth } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [epin, setEpin] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'semi-annual' | null>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await merchantAPI.getSubscriptionStatus();
      setStatus(res.data.data);
    } catch (err) {
      console.error('Failed to fetch subscription status');
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }

    if (epin.length !== 5) {
      toast.error('Please enter a valid 5-digit ePin');
      return;
    }

    setLoading(true);
    try {
      const res = await merchantAPI.subscribe({ planType: selectedPlan, epin });
      if (res.data.success) {
        toast.success('Subscription activated! Your account is now unlocked.');
        
        // Refresh session
        const profileRes = await merchantAPI.getSubscriptionStatus();
        const updatedStatus = profileRes.data.data;
        
        // We need to update the global user state so the layout unlocks
        const { authAPI } = await import('@/lib/api');
        const userRes = await authAPI.getProfile();
        const token = localStorage.getItem('token') || '';
        if (userRes.data.success) {
          setAuth(userRes.data.data, token);
        }
        
        router.push('/merchant');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 5000,
      duration: '1 Month',
      icon: Clock,
      features: [
        'Full access to Merchant Dashboard',
        'Process unlimited payments',
        'Sales analytics & reports',
        '24/7 Priority support'
      ],
      color: 'blue'
    },
    {
      id: 'semi-annual',
      name: '6 Months Saver',
      price: 25000,
      duration: '6 Months',
      icon: Zap,
      features: [
        'All Monthly Plan features',
        'Save ৳5000 compared to monthly',
        'Extended account verification',
        'Featured merchant badge'
      ],
      color: 'indigo'
    }
  ];

  const expiryDate = status?.expiry ? new Date(status.expiry).toLocaleDateString() : 'None';
  const isActive = status?.isSubscribed;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Merchant Subscription</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Choose a plan to activate your merchant account and start accepting payments.
        </p>
      </div>

      {/* Status Alert if not active */}
      {!isActive && (
        <div className="mb-10 bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900">Account Locked</h3>
              <p className="text-amber-800">Your merchant actions are currently restricted. Please subscribe to a plan to unlock full functionality.</p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selection */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id as any)}
            className={`relative cursor-pointer transition-all duration-300 rounded-3xl p-8 border-2 ${
              selectedPlan === plan.id 
                ? 'border-blue-500 bg-blue-50/50 shadow-xl scale-[1.02]' 
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
            }`}
          >
            {selectedPlan === plan.id && (
              <div className="absolute top-4 right-4 animate-scaleIn">
                <CheckCircle2 className="w-8 h-8 text-blue-500 fill-white" />
              </div>
            )}
            
            <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center ${
              plan.id === 'monthly' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <plan.icon className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-slate-900">৳{plan.price.toLocaleString()}</span>
              <span className="text-slate-500 font-medium">/ {plan.duration}</span>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Confirmation Form */}
      {selectedPlan && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl max-w-2xl mx-auto animate-fadeIn">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-500" />
            Payment Confirmation
          </h3>
          
          <form onSubmit={handleSubscribe} className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500 font-medium text-sm">Selected Plan</span>
                <span className="text-slate-900 font-bold">{plans.find(p => p.id === selectedPlan)?.name}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                <span className="text-slate-500 font-medium text-sm">Total Amount</span>
                <span className="text-2xl font-black text-blue-600">৳{plans.find(p => p.id === selectedPlan)?.price.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm with your 5-digit ePin</label>
              <input 
                type="password"
                maxLength={5}
                required
                value={epin}
                onChange={(e) => setEpin(e.target.value)}
                placeholder="•••••"
                className="w-full text-center tracking-widest text-2xl py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-6 h-6" />
                  Pay & Activate
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 text-center text-slate-500 text-sm">
        <p>Current Balance: <span className="font-bold text-slate-700">৳{user?.wallet?.balance.toLocaleString()}</span></p>
        <p className="mt-2 text-[12px]">All payments are final and non-refundable. Subscription will activate instantly upon successful payment.</p>
      </div>
    </div>
  );
}
