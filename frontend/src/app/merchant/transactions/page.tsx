'use client';

import MerchantTransactionList from '@/components/MerchantTransactionList';
import { useAuthStore } from '@/lib/store';

export default function MerchantTransactionsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Ledger & Transaction History</h1>
        <p className="text-slate-500 text-sm mt-1">Review and filter all incoming and outgoing merchant activity.</p>
      </div>

      <MerchantTransactionList />
    </div>
  );
}
