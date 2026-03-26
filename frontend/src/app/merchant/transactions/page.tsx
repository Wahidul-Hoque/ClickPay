'use client';

import MerchantTransactionList from '@/components/MerchantTransactionList';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
export default function MerchantTransactionsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="mb-4">
          <Link 
            href='/merchant'
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Merchant Dashboard
          </Link>
        </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Ledger & Transaction History</h1>
        <p className="text-slate-500 text-sm mt-1">Review and filter all incoming and outgoing merchant activity.</p>
      </div>

      <MerchantTransactionList />
    </div>
  );
}
