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
  Clock,
  ArrowLeft,
  Loader2,
  Trophy
} from 'lucide-react';

export default function MerchantSubscriptionPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, setAuth } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [epin, setEpin] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'semi-annual' | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Selection, 2: Review, 3: ePin

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
    if (!selectedPlanId) {
      toast.error('Please select a plan first');
      return;
    }

    if (epin.length !== 5) {
      toast.error('Please enter a valid 5-digit ePin');
      return;
    }

    setLoading(true);
    try {
      const res = await merchantAPI.subscribe({ planType: selectedPlanId, epin });
      if (res.data.success) {
        toast.success('Subscription activated! Your account is now unlocked.');
        
        // Refresh session
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
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
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
      theme: 'blue',
      features: [
        'Full access to Merchant Dashboard',
        'Process unlimited payments',
        'Sales analytics & reports',
        '24/7 Priority support'
      ]
    },
    {
      id: 'semi-annual',
      name: '6 Months Saver',
      price: 25000,
      duration: '6 Months',
      icon: Trophy,
      theme: 'indigo',
      features: [
        'All Monthly Plan features',
        'Save ৳5000 compared to monthly',
        'Extended account verification',
        'Featured merchant badge'
      ]
    }
  ];

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const isActive = status?.isSubscribed;

  const nextStep = () => {
      if (currentStep === 1 && !selectedPlanId) {
          toast.error("Please select a plan first");
          return;
      }
      setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Merchant Hub</h1>
        <div className="flex items-center justify-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
            <span className={currentStep >= 1 ? "text-primary-600" : ""}>Plan Selection</span>
            <div className={`w-8 h-0.5 rounded-full ${currentStep >= 2 ? "bg-primary-600" : "bg-slate-200"}`} />
            <span className={currentStep >= 2 ? "text-primary-600" : ""}>Review</span>
            <div className={`w-8 h-0.5 rounded-full ${currentStep >= 3 ? "bg-primary-600" : "bg-slate-200"}`} />
            <span className={currentStep >= 3 ? "text-primary-600" : ""}>Payment</span>
        </div>
      </div>

      {/* Current Status */}
      {status?.expiry && (
        <div className="mb-10 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between animate-slideIn">
           <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Subscription Ends On</p>
                 <h2 className="text-xl font-black text-slate-900">{new Date(status.expiry).toLocaleDateString()}</h2>
              </div>
           </div>
           <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${
              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
           }`}>
              {isActive ? 'Active' : 'Expired'}
           </div>
        </div>
      )}

      {/* Status Alert if not active */}
      {!isActive && currentStep === 1 && (
        <div className="mb-10 bg-amber-50 border-2 border-amber-100 p-8 rounded-[2.5rem] shadow-sm animate-slideIn">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Lock className="w-8 h-8 text-amber-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-900 tracking-tight">Account Restricted</h3>
              <p className="text-amber-800 font-medium">To start accepting payments and viewing analytics, you must activate a merchant plan.</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Selection */}
      {currentStep === 1 && (
        <div className="grid md:grid-cols-2 gap-8 mb-12 animate-fadeIn">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id as any)}
              className={`relative cursor-pointer transition-all duration-500 rounded-[2.5rem] p-10 border-4 ${
                selectedPlanId === plan.id 
                  ? 'border-primary-600 bg-primary-50/30' 
                  : 'border-slate-100 bg-white hover:border-slate-200'
              } group`}
            >
              {selectedPlanId === plan.id && (
                <div className="absolute top-6 right-6 animate-scaleIn">
                  <CheckCircle2 className="w-10 h-10 text-primary-600 fill-white" />
                </div>
              )}
              
              <div className={`w-16 h-16 rounded-3xl mb-8 flex items-center justify-center transition-transform group-hover:scale-110 ${
                plan.theme === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                <plan.icon className="w-8 h-8 font-black" />
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">৳{plan.price.toLocaleString()}</span>
                <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">/ {plan.duration}</span>
              </div>

              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-slate-600 font-bold text-sm tracking-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          <button 
            disabled={!selectedPlanId}
            onClick={nextStep}
            className="md:col-span-2 w-full mt-8 bg-slate-900 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            Continue to Review <ArrowLeft className="rotate-180 w-5 h-5" />
          </button>
        </div>
      )}

      {/* STEP 2: Review */}
      {currentStep === 2 && selectedPlan && (
        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-12 shadow-2xl max-w-3xl mx-auto animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <selectedPlan.icon size={120} />
            </div>

            <button onClick={prevStep} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-8 hover:text-slate-600">
                <ArrowLeft size={14} /> Change Plan
            </button>

            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-8 uppercase italic flex items-center gap-4">
               <ShieldCheck className="text-primary-600 w-10 h-10" />
               Summary Check
            </h3>
            
            <div className="bg-slate-50 rounded-3xl p-8 mb-10 space-y-6">
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Selected Tier</span>
                    <span className="font-black text-slate-900 text-xl">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Subscription Window</span>
                    <span className="font-black text-slate-900">{selectedPlan.duration}</span>
                </div>
                <div className="pt-6 border-t-2 border-slate-200 flex justify-between items-end">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Activation Fee</span>
                    <span className="text-4xl font-black text-primary-600 tracking-tighter">৳{selectedPlan.price.toLocaleString()}</span>
                </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 mb-10 border border-amber-100 flex items-start gap-4">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 font-bold uppercase tracking-wide leading-relaxed">
                    Account access will be granted instantly upon successful verification. Your next bill will be in {selectedPlan.duration}.
                </p>
            </div>

            <button 
              onClick={nextStep}
              className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
            >
              Verify & Pay <Lock size={18} />
            </button>
        </div>
      )}

      {/* STEP 3: Payment/ePin */}
      {currentStep === 3 && selectedPlan && (
        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-12 shadow-2xl max-w-xl mx-auto animate-fadeIn">
            <button onClick={prevStep} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-12 hover:text-slate-600">
                <ArrowLeft size={14} /> Back to Review
            </button>

            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-12 text-center uppercase">Security Verification</h3>
            
            <form onSubmit={handleSubscribe} className="space-y-12">
                <div className="text-center">
                    <div className="relative max-w-[240px] mx-auto group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600" />
                        <input 
                            autoFocus
                            type="password"
                            maxLength={5}
                            required
                            value={epin}
                            onChange={(e) => setEpin(e.target.value.replace(/\D/g, ''))}
                            placeholder="•••••"
                            className="w-full text-center tracking-[0.5em] text-4xl py-6 bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-primary-500 focus:bg-white focus:ring-0 outline-none font-mono transition-all"
                        />
                    </div>
                    <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter 5-digit security code</p>
                </div>

                <div className="space-y-4">
                    <button 
                      type="submit"
                      disabled={loading || epin.length !== 5}
                      className="w-full py-6 bg-primary-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-primary-700 transition-all disabled:grayscale shadow-[0_20px_40px_-5px_rgba(var(--primary-600-rgb),0.3)] flex items-center justify-center gap-3 active:scale-95"
                    >
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-6 h-6" />
                          Confirm & Activate Now
                        </>
                      )}
                    </button>
                    <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">Digital activation is non-refundable</p>
                </div>
            </form>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
        <p>Current Balance: <span className="text-slate-900 font-black">৳{user?.wallet?.balance.toLocaleString()}</span></p>
      </div>
    </div>
  );
}
