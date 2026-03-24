'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, CreditCard, CheckCircle, Loader2, AlertCircle, ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { paymentMethodAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';

export default function AddMoneyPage({ basePath }: { basePath: string }) {
  const router = useRouter();
  const toast = useToast();
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    paymentMethodAPI.getMyMethods().then(res => setMethods(res.data.data));
  }, []);

  const handleTopup = async () => {
    setStatus('submitting');
    try {
      await paymentMethodAPI.topup({ methodId: selectedMethod.method_id, amount });
      setStatus('success');
      toast.success('Funds added successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Transaction failed");
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6 animate-scaleIn">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-50">
          <CheckCircle className="w-14 h-14" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Transfer Success!</h1>
        <p className="text-lg text-slate-500">৳{amount} has been added to your ClickPay wallet.</p>
        <button onClick={() => router.push(basePath)} className="w-full btn btn-primary py-4 text-lg">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="flex items-center gap-4">
        <Link href={`${basePath}/payment_methods`} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </Link>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Add Money</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side: Method Selection */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">1. Select Source Account</h2>
          <div className="grid gap-3">
            {methods.map((method: any) => (
              <button 
                key={method.method_id} 
                onClick={() => setSelectedMethod(method)}
                className={`flex items-center justify-between p-6 card border-2 transition-all ${selectedMethod?.method_id === method.method_id ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-50' : 'border-slate-50 hover:border-slate-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${method.method_type === 'bank' ? 'bg-primary-100 text-primary-600' : 'bg-purple-100 text-purple-600'}`}>
                    {method.method_type === 'bank' ? <Landmark className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-lg">{method.bank_name || method.network_name}</p>
                    <p className="text-sm text-slate-500 font-mono">{method.identifier}</p>
                  </div>
                </div>
              </button>
            ))}
            <Link href={`${basePath}/payment_methods/link`} className="flex items-center gap-4 p-6 card border-2 border-dashed text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all font-bold">
               <div className="p-4 bg-slate-50 rounded-2xl"><Plus className="w-6 h-6" /></div>
               Link New Method
            </Link>
          </div>
        </div>

        {/* Right Side: Amount & Action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-6 sticky top-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">2. Set Amount</h2>
            
            <div className="relative group">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300 group-focus-within:text-primary-600 transition-colors">৳</span>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="w-full p-8 pl-16 text-5xl font-black rounded-3xl border-2 border-slate-100 focus:border-primary-500 focus:ring-0 outline-none transition-all placeholder:text-slate-100" 
                placeholder="0" 
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['500', '1000', '5000'].map(val => (
                <button key={val} onClick={() => setAmount(val)} className="py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 transition-colors">+{val}</button>
              ))}
            </div>

            <button 
              disabled={!amount || !selectedMethod || status === 'submitting'} 
              onClick={handleTopup}
              className="w-full py-6 btn btn-primary text-xl font-black rounded-3xl shadow-2xl shadow-primary-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="animate-spin w-6 h-6" /> Verifying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-6 h-6" /> Add Money Now
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-slate-400 font-medium px-4 leading-relaxed">
              By proceeding, you authorize ClickPay to pull funds from your linked {selectedMethod?.bank_name || 'external account'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}