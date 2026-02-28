'use client';

import { useEffect, useState } from 'react';
import { walletAPI } from '@/lib/api';
import { CreditCard, Landmark, Plus, Trash2, ShieldCheck, Loader2 } from 'lucide-react';

interface PaymentMethod {
  payment_method_id: string;
  type: 'bank' | 'card';
  provider: string;
  masked_identifier: string;
  status: 'active' | 'disabled';
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const response = await walletAPI.getPaymentMethods();
      setMethods(response.data.data);
    } catch (error) {
      console.error('Failed to fetch methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    try {
      await walletAPI.removePaymentMethod(id);
      setMethods(methods.filter(m => m.payment_method_id !== id));
    } catch (error) {
      alert('Failed to remove method');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Methods</h1>
          <p className="text-slate-500 text-sm">Manage your linked cards and bank accounts</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : methods.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No payment methods linked</p>
          <p className="text-slate-400 text-sm mt-1">Add a card or bank account to top up your wallet easily.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {methods.map((method) => (
            <div key={method.payment_method_id} className="card hover:border-primary-200 transition-colors flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method.type === 'card' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {method.type === 'card' ? <CreditCard /> : <Landmark />}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{method.provider}</p>
                  <p className="text-sm text-slate-500 font-mono">{method.masked_identifier}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${method.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {method.status}
                </span>
                <button 
                  onClick={() => handleDelete(method.payment_method_id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3 border border-slate-200">
        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Your payment information is encrypted and stored securely. We use industry-standard tokenization to ensure your sensitive data never hits our servers directly.
        </p>
      </div>
    </div>
  );
}