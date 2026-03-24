'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, CreditCard, ShieldCheck, ArrowLeft, Loader2, Lock, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { paymentMethodAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';

export default function LinkAccountPage({ basePath }: { basePath: string }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [type, setType] = useState<'bank' | 'card'>('bank');
  const [options, setOptions] = useState({ banks: [], networks: [] });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ phoneNumber: '', bankPin: '', cardNumber: '', expiryDate: '', cvv: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    paymentMethodAPI.getOptions().then(res => setOptions(res.data.data));
  }, []);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { 
        type, 
        ...(type === 'bank' ? { bankId: selectedId, ...formData } : { networkId: selectedId, ...formData }) 
      };
      await paymentMethodAPI.link(payload);
      toast.success('Account linked successfully');
      router.push(`${basePath}/payment_methods`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Linking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <Link href={`${basePath}/payment_methods`} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Link New Method</h1>
      </div>

      {step === 'selection' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banks */}
          <div className="card space-y-4 border-t-4 border-t-primary-500">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center"><Landmark className="text-primary-600" /></div>
            <h2 className="text-xl font-bold text-slate-800">Bank Accounts</h2>
            <div className="space-y-2">
              {options.banks?.map((bank: any) => (
                <button key={bank.bank_id} onClick={() => { setSelectedId(bank.bank_id); setType('bank'); setStep('form'); }}
                  className="w-full text-left p-4 hover:bg-slate-50 rounded-xl border border-slate-100 font-semibold text-slate-700 transition-colors flex items-center justify-between group">
                  {bank.name}
                  <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary-600" />
                </button>
              ))}
            </div>
          </div>
          {/* Cards */}
          <div className="card space-y-4 border-t-4 border-t-purple-500">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center"><CreditCard className="text-purple-600" /></div>
            <h2 className="text-xl font-bold text-slate-800">Card Networks</h2>
            <div className="space-y-2">
              {options.networks?.map((net: any) => (
                <button key={net.network_id} onClick={() => { setSelectedId(net.network_id); setType('card'); setStep('form'); }}
                  className="w-full text-left p-4 hover:bg-slate-50 rounded-xl border border-slate-100 font-semibold text-slate-700 transition-colors flex items-center justify-between group">
                  {net.name}
                  <Plus className="w-4 h-4 text-slate-300 group-hover:text-purple-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card max-w-md mx-auto p-8 shadow-2xl animate-scaleIn">
          <form onSubmit={handleLink} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Verify Account</h2>
              <p className="text-slate-500 text-sm">Provide credentials to verify ownership with your bank.</p>
            </div>

            <div className="space-y-4">
              {type === 'bank' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                    <input type="text" placeholder="01XXXXXXXXX" required onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="input py-4 text-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Bank PIN</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                      <input type="password" placeholder="****" required maxLength={4} onChange={e => setFormData({...formData, bankPin: e.target.value})} className="input py-4 pl-12 text-2xl tracking-[0.5em]" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Card Number</label>
                    <input type="text" placeholder="XXXX XXXX XXXX XXXX" required onChange={e => setFormData({...formData, cardNumber: e.target.value})} className="input py-4 font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM/YY" required onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="input py-4 text-center" />
                    <input type="password" placeholder="CVV" required maxLength={3} onChange={e => setFormData({...formData, cvv: e.target.value})} className="input py-4 text-center" />
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3 border border-slate-100">
               <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
               <p className="text-xs text-slate-500 leading-relaxed font-medium">Your credentials are processed directly via secure handshake and are never stored in ClickPay's database.</p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('selection')} className="flex-1 btn bg-slate-100 hover:bg-slate-200 text-slate-600">Back</button>
              <button type="submit" disabled={submitting} className="flex-[2] btn btn-primary flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm & Link'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}