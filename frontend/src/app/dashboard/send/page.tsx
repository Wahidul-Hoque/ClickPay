'use client';

import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';
import { useRouter } from 'next/navigation';
import { transactionAPI, favoriteAPI } from '@/lib/api';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';
import { TransactionWizard } from '@/components/TransactionWizard';

export default function SendMoneyPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [savedContacts, setSavedContacts] = useState<any[]>([]);

  // Fetch saved contacts on load
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const [numRes, agentRes] = await Promise.all([
          favoriteAPI.getFavorites('number'),
          favoriteAPI.getFavorites('agent')
        ]);
        const nums = numRes.data?.data || [];
        const agents = agentRes.data?.data || [];
        setSavedContacts([...nums, ...agents]);
      } catch (err) {
        console.error("Failed to load saved contacts", err);
      }
    };
    fetchContacts();
  }, []);

  const calculateFee = (amount: number, target: string, isFavorite: boolean) => {
    return isFavorite ? 0.00 : 5.00;
  };

  const handleExecute = async (data: { target: string; amount: number; epin: string; note: string }) => {
    setLoading(true);
    toast.info('Processing transaction...');

    try {
      const response = await transactionAPI.send({
        toPhone: data.target,
        amount: data.amount,
        epin: data.epin
      });

      if (response.data.success) {
        setResult({ ...response.data.data, toPhone: data.target, amount: data.amount, note: data.note });
        setSuccess(true);
        toast.success(`৳${data.amount} sent successfully!`);
      }
    } catch (error: any) {
      console.error('Send money error:', error);
      toast.error(error.response?.data?.message || 'Failed to send money. Please try again.');
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
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-8 px-4">
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