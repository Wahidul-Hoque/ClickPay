'use client';

import { useState, useEffect } from 'react';
import { Send , ArrowLeft } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import { useRouter } from 'next/navigation';
import { transactionAPI, favoriteAPI, systemAPI } from '@/lib/api';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';
import { TransactionWizard } from '@/components/TransactionWizard';
import Link from 'next/link';
export default function SendMoneyPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [savedContacts, setSavedContacts] = useState<any[]>([]);
  const [sendMoneyFee, setSendMoneyFee] = useState<number>(5.00);

  // Fetch saved contacts on load
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const [numRes, agentRes, settingsRes] = await Promise.all([
          favoriteAPI.getFavorites('number'),
          favoriteAPI.getFavorites('agent'),
          systemAPI.getSettings()
        ]);
        const nums = numRes.data?.data || [];
        const agents = agentRes.data?.data || [];
        setSavedContacts([...nums, ...agents]);
        
        if (settingsRes.data.success && settingsRes.data.settings.send_money_fee) {
          setSendMoneyFee(settingsRes.data.settings.send_money_fee);
        }
      } catch (err) {
        console.error("Failed to load saved contacts", err);
      }
    };
    fetchContacts();
  }, []);

  const calculateFee = (amount: number, recipient: string, isFavorite: boolean) => {
    return isFavorite ? 0.00 : sendMoneyFee;
  };

  const handleExecute = async (data: { recipient: string; amount: number; epin: string; note: string }) => {
    setLoading(true);
    toast.info('Processing transaction...');

    try {
      const response = await transactionAPI.send({
        toPhone: data.recipient,
        amount: data.amount,
        epin: data.epin
      });

      if (response.data.success) {
        setResult({ ...response.data.data, toPhone: data.recipient, amount: data.amount, note: data.note });
        setSuccess(true);
        toast.success(`৳${data.amount} sent successfully!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send money. Please try again.');
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
      <div className="min-h-[calc(100vh-8rem)] flex items-center flex-col justify-center py-8">
        <TransactionSummaryModal
          isOpen={success}
          onClose={() => {
            setSuccess(false);
            setResult(null);
            router.push('/dashboard');
          }}
          title="Money Sent Successfully"
          accountLabel="Recipient"
          account={result.to_phone || result.phone || result.toPhone}
          amount={result.amount}
          charge={result.charge || '0.00'}
          transactionId={result.transaction_id || result.reference || ''}
          reference={result.note || result.reference || 'Transfer'}
          time={result.date || result.created_at ? new Date(result.date || result.created_at).toLocaleString('en-GB') : new Date().toLocaleString()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-2xl mb-4 self-center">
          <Link
            href='/dashboard'
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </div>
      <TransactionWizard
        title="Send Money"
        subtitle="Transfer money to anyone instantly securely"
        icon={<Send />}
        themeColor="primary"
        accountLabel="Recipient Phone Number"
        savedContacts={savedContacts}
        calculateFee={calculateFee}
        onExecute={handleExecute}
        isLoading={loading}
      />
    </div>
  );
}