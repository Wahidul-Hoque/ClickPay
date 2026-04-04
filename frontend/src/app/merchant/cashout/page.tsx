'use client';

import { useState, useEffect } from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import { useRouter } from 'next/navigation';
import { transactionAPI, walletAPI, systemAPI } from '@/lib/api';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';
import { TransactionWizard } from '@/components/TransactionWizard';
import Link from 'next/link';

export default function MerchantCashoutPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fee rate (will be fetched from system settings)
  const [feeRate, setFeeRate] = useState<number>(0.015); // 1.5% default fallback

  useEffect(() => {
    fetchBalance();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await systemAPI.getSettings();
      if (res.data.success) {
        const sys = res.data.settings.cashout_system_fee || 0.01;
        const agt = res.data.settings.cashout_agent_fee || 0.005;
        setFeeRate(sys + agt);
      }
    } catch (err) {
      console.error('Failed to fetch cashout settings');
    }
  };

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

  const calculateFee = (amount: number, recipient: string, isFavorite: boolean) => {
    return amount * feeRate;
  };

  const handleExecute = async (data: { recipient: string; amount: number; epin: string; note: string }) => {
    const totalDeduction = data.amount + calculateFee(data.amount, data.recipient, false);
    
    if (totalDeduction > balance) {
      toast.error(`Insufficient balance including ${(feeRate * 100).toFixed(1)}% fee.`);
      return;
    }

    setLoading(true);
    toast.info('Processing merchant cashout...');

    try {
      const response = await transactionAPI.cashOut({
        agentPhone: data.recipient,
        amount: data.amount,
        epin: data.epin
      });

      if (response.data.success) {
        setResult({ ...response.data.data, recipient: data.recipient, numAmount: data.amount });
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
    const totalFee = result.numAmount * feeRate;
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center flex-col justify-center py-8">
        <TransactionSummaryModal
          isOpen={success}
          onClose={() => {
            setSuccess(false);
            router.push('/merchant');
          }}
          title="Merchant Cashout Successful"
          accountLabel="Agent Number"
          account={result.recipient}
          amount={result.amount || result.numAmount}
          charge={result.fee || totalFee.toFixed(2)}
          transactionId={result.transaction_id || result.reference || ''}
          reference="Merchant Withdrawal"
          time={result.date ? new Date(result.date).toLocaleString('en-GB') : new Date().toLocaleString()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-2xl mb-4 self-center">
          <Link
            href='/merchant'
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Merchant Dashboard
          </Link>
        </div>
      <TransactionWizard
        title="Merchant Cash Out"
        subtitle="Withdraw your earnings instantly via any Agent"
        icon={<Download />}
        themeColor="primary"
        accountLabel="Agent Phone Number"
        balance={balance}
        calculateFee={calculateFee}
        onExecute={handleExecute}
        isLoading={loading}
      />
    </div>
  );
}
