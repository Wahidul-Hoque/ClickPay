'use client';
 
import { useState, useEffect } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import { merchantAPI, systemAPI } from '@/lib/api';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';
import Link from 'next/link';
import { TransactionWizard } from '@/components/TransactionWizard';
 
export default function MerchantSendMoneyPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [commissionRate, setCommissionRate] = useState<number>(0.0125); // 1.25% default
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await systemAPI.getSettings();
        if (res.data.success && res.data.settings.merchant_fee) {
          setCommissionRate(res.data.settings.merchant_fee);
        }
      } catch (err) {
        console.error("Failed to load merchant settings", err);
      }
    };
    fetchSettings();
  }, []);

  const calculateFee = (amount: number, recipient: string, isFavorite: boolean) => {
    return parseFloat((amount * commissionRate).toFixed(2));
  };

  const handleExecute = async (data: { recipient: string; amount: number; epin: string; note: string }) => {
    setLoading(true);
    toast.info('Initiating transfer...');

    try {
      const response = await merchantAPI.sendMoney({
        toPhone: data.recipient,
        amount: data.amount,
        epin: data.epin
      });

      if (response.data.success) {
        const txResult = response.data.data;
        setResult({ ...txResult, recipient: data.recipient, numAmount: data.amount });
        setSuccess(true);
        toast.success(`৳${txResult.amount || data.amount} sent successfully!`);
      } else {
        toast.error(response.data.message || 'Transfer failed');
      }
    } catch (error: any) {
      console.error('Merchant Send Error:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to process transfer';
      toast.error(msg);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success && result) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center flex-col justify-center py-6">
        <TransactionSummaryModal
          isOpen={success}
          onClose={() => setSuccess(false)}
          title="Merchant Transfer Complete"
          accountLabel="Recipient"
          account={result.to_phone || result.recipient || 'Recipient'}
          amount={result.amount || result.numAmount}
          charge={result.fee !== undefined ? result.fee : calculateFee(result.numAmount || result.amount || 0, result.recipient || '', false)}
          transactionId={result.transaction_id || result.transactionId || 'PENDING'}
          reference={result.reference || 'Merchant Send'}
          time={new Date().toLocaleString()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center py-6 px-4">      
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="mb-4">
          <Link 
            href='/merchant'
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Merchant Dashboard
          </Link>
        </div>
        
        <TransactionWizard
          title="Send Money"
          subtitle="B2B and Customer Settlements with Instant Payout"
          icon={<Send />}
          themeColor="primary"
          accountLabel="Recipient Phone Number"
          calculateFee={calculateFee}
          onExecute={handleExecute}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
