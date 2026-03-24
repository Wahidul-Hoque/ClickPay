'use client';

import React, { useEffect, useState } from 'react';
import { 
  Landmark, 
  CreditCard, 
  Plus, 
  ArrowUpRight, 
  Wallet, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';
import { paymentMethodAPI, walletAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';

export default function PaymentMethod({ basePath }: { basePath: string }) {
  const toast = useToast();
  const [methods, setMethods] = useState([]);
  const [balance, setBalance] = useState<any>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
  try {
    setLoading(true);
    
    // Using Promise.all to fetch both linked methods and balance at once
    const [methodsRes, balanceRes] = await Promise.all([
      paymentMethodAPI.getMyMethods(),
      walletAPI.getBalance()
    ]);

    // Handle Methods
    if (methodsRes.data.success) {
      setMethods(methodsRes.data.data); 
    }

    // Handle Balance (Matching your working code)
    if (balanceRes.data.success) {
      // Since response.data.data worked in your other page, use it here too
      setBalance(balanceRes.data.data); 
    }

  } catch (err) {
    console.log("Error fetching payment data:", err);
    console.error("Failed to load payment data:", err);
    toast.error("Failed to load payment methods");
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <p className="mt-4 text-slate-500">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* ── Section 1: Wallet Balance ──────────────── */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white shadow-xl shadow-primary-200">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-primary-100 font-medium text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Available MFS Balance
            </p>
            <h1 className="text-4xl font-black">৳ {parseFloat(balance).toLocaleString()}</h1>
          </div>
          <Link href={`${basePath}/payment_methods/add-money`} className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all">
            <Plus className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* ── Section 2: Quick Actions ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={`${basePath}/payment_methods/add-money`} className="card flex flex-row items-center gap-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary-100 group">
          <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-lg block">Add Money</span>
            <span className="text-sm text-slate-500">Top up from bank or card</span>
          </div>
        </Link>
        
        <Link href={`${basePath}/payment_methods/link`} className="card flex flex-row items-center gap-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary-100 group">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-lg block">Link New Method</span>
            <span className="text-sm text-slate-500">Connect a bank or card</span>
          </div>
        </Link>
      </div>

      {/* ── Section 3: Linked Methods ──────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500 w-6 h-6" /> Linked Accounts
          </h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {methods.length} Active
          </span>
        </div>

        {methods.length === 0 ? (
          <div className="card bg-slate-50 border-dashed border-2 flex flex-col items-center py-12 text-slate-500">
            <ShieldCheck className="w-12 h-12 mb-2 opacity-20" />
            <p className="font-medium">No external accounts linked yet.</p>
            <Link href={`${basePath}/payment_methods/link`} className="text-primary-600 font-bold mt-2 hover:underline">Link your first account</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {methods.map((method: any) => (
              <div key={method.method_id} className="card flex items-center justify-between hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${method.method_type === 'bank' ? 'bg-primary-50 text-primary-600' : 'bg-purple-50 text-purple-600'}`}>
                    {method.method_type === 'bank' ? <Landmark className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{method.bank_name || method.network_name}</h3>
                    <p className="text-sm text-slate-500 font-mono tracking-tight">{method.identifier}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}