'use client';

import { useState } from 'react';
import { Download, ArrowLeft} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/toastcontext';
import api from '@/lib/api';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';
import { TransactionWizard } from '@/components/TransactionWizard';

export default function CashInPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculateFee = (amount: number, recipient: string, isFavorite: boolean) => 0;

  const handleExecute = async (data: { recipient: string; amount: number; epin: string; note: string }) => {
    setLoading(true);

    try {
      const response = await api.post('/agent/cash-in', {
        userPhone: data.recipient,
        amount: data.amount,
        epin: data.epin,
      });

      if (response.data.success) {
        setResult({ ...response.data.data, recipient: data.recipient, numAmount: data.amount });
        setSuccess(true);
        toast.success(`৳${data.amount} deposited successfully!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cash-in failed. Please check user phone and ePin.');
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn p-4 min-h-[calc(100vh-8rem)] flex flex-col justify-center">
        <TransactionSummaryModal
          isOpen={success}
          onClose={() => setSuccess(false)}
          title="Cash In Successful"
          accountLabel="User Phone"
          account={result.to_phone || result.phone || result.recipient}
          amount={result.amount || result.amount_sent || result.numAmount}
          charge={result.charge || '0.00'}
          transactionId={result.transaction_id || ''}
          reference={result.reference || 'Agent Deposit'}
          time={result.created_at ? new Date(result.created_at).toLocaleString('en-GB') : new Date().toLocaleString()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn py-8 px-4">
        <div className="mb-4">
          <Link 
            href='/agent'
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Agent Dashboard
          </Link>
        </div>
      <TransactionWizard
        title="Agent Cash In"
        subtitle="Transfer physical cash into a user's wallet"
        icon={<Download />}
        themeColor="emerald"
        accountLabel="User Phone Number"
        calculateFee={calculateFee}
        onExecute={handleExecute}
        isLoading={loading}
      />
    </div>
  );
}