'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import { useRouter } from 'next/navigation';
import { transactionAPI, walletAPI } from '@/lib/api';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';
import { TransactionWizard } from '@/components/TransactionWizard';

export default function CashoutPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fee constants
  const FEE_PERCENT = 0.015; // 1.5% total

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await walletAPI.getBalance();
      if (response.data.success) {
        setBalance(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch balance');
    }
  };

  const calculateFee = (amount: number, target: string, isFavorite: boolean) => {
    return amount * FEE_PERCENT;
  };

  const handleExecute = async (data: { target: string; amount: number; epin: string; note: string }) => {
    const totalDeduction = data.amount + calculateFee(data.amount, data.target, false);
    
    if (totalDeduction > balance) {
      toast.error('Insufficient balance including 1.5% fee.');
      return;
    }

    setLoading(true);
    toast.info('Processing cashout...');

    try {
      const response = await transactionAPI.cashOut({
        agentPhone: data.target,
        amount: data.amount,
        epin: data.epin
      });

      if (response.data.success) {
        setResult({ ...response.data.data, target: data.target, numAmount: data.amount });
        setSuccess(true);
        toast.success(`৳${data.amount} cashed out successfully!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process cashout.');
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
    const totalFee = result.numAmount * FEE_PERCENT;
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center flex-col justify-center py-8">
        <TransactionSummaryModal
          isOpen={success}
          onClose={() => {
            setSuccess(false);
            router.push('/dashboard');
          }}
          title="Cashout Successful"
          accountLabel="Agent Number"
          account={result.target}
          amount={result.amount || result.numAmount}
          charge={result.fee || totalFee.toFixed(2)}
          transactionId={result.transaction_id || result.reference || ''}
          reference="Agent Withdrawal"
          time={result.date ? new Date(result.date).toLocaleString('en-GB') : new Date().toLocaleString()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-8 px-4">
      <TransactionWizard
        title="Cash Out"
        subtitle="Withdraw money instantly via an Agent"
        icon={<Download />}
        themeColor="indigo"
        accountLabel="Agent Phone Number"
        balance={balance}
        calculateFee={calculateFee}
        onExecute={handleExecute}
        isLoading={loading}
      />
    </div>
  );
}