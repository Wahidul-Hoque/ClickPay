'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, CreditCard, CheckCircle, Loader2, AlertCircle, ArrowLeft, RefreshCw, Plus, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { paymentMethodAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';

export default function AddMoneyPage({ basePath }: { basePath: string }) {
  const router = useRouter();
  const toast = useToast();
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'review' | 'submitting' | 'success'>('idle');
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    paymentMethodAPI.getMyMethods().then(res => setMethods(res.data.data || []));
  }, []);

  const handleTopup = async () => {
    if (!selectedMethod || !amount) return;
    setStatus('submitting');
    try {
      const res = await paymentMethodAPI.topup({ methodId: selectedMethod.method_id, amount });
      setSuccessData({
        amount: amount,
        method_name: selectedMethod.bank_name || selectedMethod.network_name,
        identifier: selectedMethod.identifier,
        transaction_id: res.data.data?.transaction_id || 'TXN-' + Date.now()
      });
      setStatus('success');
      toast.success('Funds added successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transaction failed");
      setStatus('review');
    }
  };

  if (status === 'success' && successData) {
    return (
        <div className="max-w-2xl mx-auto py-12 animate-fadeIn">
            <TransactionSummaryModal
                isOpen={true}
                onClose={() => {
                    setStatus('idle');
                    setAmount('');
                    setSelectedMethod(null);
                    router.push(basePath);
                }}
                title="Add Money Success"
                accountLabel="Source Account"
                account={`${successData.method_name} (${successData.identifier})`}
                amount={successData.amount}
                charge="0.00"
                transactionId={successData.transaction_id}
                reference="Wallet Top-up"
                time={new Date().toLocaleString()}
            />
            {/* Fallback View */}
            <div className="text-center space-y-6 mt-12">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <CheckCircle className="w-14 h-14" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Transfer Placed!</h1>
                <p className="text-lg text-slate-500 font-medium">৳{amount} has been added from {successData.method_name}.</p>
                <button onClick={() => router.push(basePath)} className="w-full btn btn-primary py-4 text-lg rounded-[1.5rem]">Done</button>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => {
            if (status === 'review') setStatus('idle');
            else router.push(`${basePath}/payment_methods`);
          }} 
          className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Add Funds</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {status === 'idle' ? 'Select source and amount' : 'Review and confirm transfer'}
            </p>
        </div>
      </div>

      {status === 'idle' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fadeIn">
          {/* Section 1: Selection */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center text-[8px] text-slate-900">1</div>
                Select Source Account
            </h2>
            <div className="grid gap-4">
              {methods.map((method: any) => (
                <button 
                  key={method.method_id} 
                  onClick={() => setSelectedMethod(method)}
                  className={`flex items-center justify-between p-7 rounded-[2rem] border-4 transition-all group ${selectedMethod?.method_id === method.method_id ? 'border-primary-600 bg-primary-50/50 shadow-xl' : 'border-slate-50 bg-white hover:border-slate-100 shadow-sm'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-5 rounded-3xl transition-transform group-hover:scale-110 ${method.method_type === 'bank' ? 'bg-primary-100 text-primary-600' : 'bg-purple-100 text-purple-600'}`}>
                      {method.method_type === 'bank' ? <Landmark className="w-7 h-7" /> : <CreditCard className="w-7 h-7" />}
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 text-xl tracking-tight">{method.bank_name || method.network_name}</p>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">{method.identifier}</p>
                    </div>
                  </div>
                  {selectedMethod?.method_id === method.method_id && <CheckCircle2 className="text-primary-600 w-8 h-8 fill-white" />}
                </button>
              ))}
              <Link href={`${basePath}/payment_methods/link`} className="flex items-center gap-6 p-7 border-4 border-dashed border-slate-100 rounded-[2rem] text-slate-300 hover:text-primary-600 hover:border-primary-200 transition-all group">
                 <div className="p-5 bg-slate-50 rounded-3xl group-hover:bg-primary-50"><Plus className="w-7 h-7" /></div>
                 <div className="text-left font-black text-lg uppercase tracking-widest">Link New Method</div>
              </Link>
            </div>
          </div>

          {/* Section 2: Amount */}
          <div className="lg:col-span-2">
            <div className="sticky top-10 space-y-8">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center text-[8px] text-slate-900">2</div>
                    Transaction Amount
                </h2>
                
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-8 border-2 border-slate-50">
                    <div className="relative group text-center">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-200 group-focus-within:text-primary-600">৳</span>
                        <input 
                            type="number" 
                            autoFocus
                            value={amount} 
                            onChange={e => setAmount(e.target.value)}
                            className="w-full text-center text-6xl font-black text-slate-900 focus:ring-0 outline-none placeholder:text-slate-50" 
                            placeholder="0" 
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {['500', '1000', '5000'].map(val => (
                            <button key={val} onClick={() => setAmount(val)} className="py-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">+{val}</button>
                        ))}
                    </div>

                    <button 
                        disabled={!amount || !selectedMethod} 
                        onClick={() => setStatus('review')}
                        className="w-full py-6 bg-slate-900 text-white text-sm font-black uppercase tracking-widest rounded-3xl shadow-xl hover:bg-primary-600 hover:shadow-primary-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-50 disabled:text-slate-300"
                    >
                        Review Transfer
                    </button>
                    
                    <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        Secure instant deposit via {selectedMethod?.bank_name || 'external partner'}
                    </p>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-white rounded-[3rem] p-12 shadow-2xl border-2 border-slate-50 animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
                <ShieldCheck size={160} />
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-10 flex items-center gap-4 relative z-10 uppercase italic">
                Confirm Transfer
            </h2>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-6 mb-10 relative z-10 transition-all hover:bg-slate-100">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From Account</span>
                    <div className="text-right">
                        <p className="font-black text-slate-900">{selectedMethod.bank_name || selectedMethod.network_name}</p>
                        <p className="text-xs font-bold text-slate-500 font-mono italic">{selectedMethod.identifier}</p>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</span>
                    <span className="font-black text-slate-900">ClickPay Wallet</span>
                </div>
                <div className="pt-6 border-t-2 border-slate-200 flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transfer Total</span>
                    <span className="text-5xl font-black text-primary-600 tracking-tighter italic">৳{Number(amount).toLocaleString()}</span>
                </div>
            </div>

            <div className="flex gap-4 relative z-10">
                <button 
                    onClick={() => setStatus('idle')}
                    className="flex-1 py-6 border-4 border-slate-100 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:border-slate-200 transition-all active:scale-95"
                >
                    Edit Amount
                </button>
                <button 
                    disabled={status === 'submitting'}
                    onClick={handleTopup}
                    className="flex-[2] py-6 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    {status === 'submitting' ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    {status === 'submitting' ? 'Transferring...' : 'Confirm Deposit'}
                </button>
            </div>
            
            <p className="text-center mt-8 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                Protected by ClickPay Secure-Lock Technology
            </p>
        </div>
      )}
    </div>
  );
}