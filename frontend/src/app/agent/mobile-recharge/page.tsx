'use client';

import React, { useEffect, useState } from 'react';
import { billAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import {
  Phone,
  ArrowLeft,
  Loader2,
  Lock,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link'; 
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';

interface Biller {
  biller_id: number;
  name: string;
  category: string;
  status: string;
}

interface BillPayment {
  bill_payment_id: number;
  amount: string;
  provider_reference: string;
  status: string;
  created_at: string;
  biller_name: string;
  biller_category: string;
  transaction_reference: string;
  reference?: string;
}

const mobileCategoryConfig = {
  icon: Phone,
  color: 'text-emerald-600',
  bgColor: 'bg-emerald-100',
  label: 'Mobile Recharge',
};

export default function AgentMobileRechargePage() {
  const toast = useToast();
  const [billers, setBillers] = useState<Biller[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [history, setHistory] = useState<BillPayment[]>([]);
  const [loadingBillers, setLoadingBillers] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<any>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({ reference: '', amount: '', epin: '' });

  useEffect(() => {
    fetchMobileBillers();
    fetchHistory();
  }, []);

  const fetchMobileBillers = async () => {
    setLoadingBillers(true);
    try {
      const response = await billAPI.getBillersByCategory('mobile');
      setBillers(response.data?.data || []);
    } catch (error) {
      console.error('Unable to load mobile billers:', error);
      toast.error('Failed to load mobile providers');
    } finally {
      setLoadingBillers(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await billAPI.getHistory();
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setHistory(data.filter((item: any) => item.biller_category?.toLowerCase?.() === 'mobile'));
    } catch (error) {
      console.error('Unable to load recharge history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBillerClick = (biller: Biller) => {
    setSelectedBiller(biller);
    setFormData({ reference: '', amount: '', epin: '' });
    setPaySuccess(null);
    setStep(1);
  };

  const handleContinue = () => {
    const amountValue = parseFloat(formData.amount);
    if (!formData.reference.trim()) {
      toast.error('Provide the customer reference');
      return;
    }
    if (!formData.amount || Number.isNaN(amountValue) || amountValue <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setStep(2);
  };

  const handlePay = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBiller) return;

    setPaying(true);
    setPaySuccess(null);

    try {
      const response = await billAPI.pay({
        billerId: selectedBiller.biller_id,
        amount: parseFloat(formData.amount),
        epin: formData.epin,
        reference: formData.reference,
      });

      if (response.data?.success) {
        setPaySuccess(response.data.data);
        toast.success(response.data.message || 'Recharge completed');
        setFormData({ reference: '', amount: '', epin: '' });
        fetchHistory();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Recharge failed');
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const hasMobileHistory = history.length > 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        {selectedBiller && (
          <button
            type="button"
            onClick={() => setSelectedBiller(null)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div>
            <div className="mb-4">
          <Link 
            href='/agent'
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Agent Dashboard
          </Link>
        </div>
          <h1 className="text-3xl font-bold text-slate-900">Mobile Recharge (Agent)</h1>
          <p className="text-slate-500 text-sm mt-1">
            {selectedBiller
              ? `Send airtime or data to ${selectedBiller.name}`
              : 'Pick a mobile network before entering customer details.'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr,1fr] gap-6">
        <section className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Providers</p>
              <h2 className="text-xl font-bold text-slate-900">Mobile Networks</h2>
            </div>
            <button
              type="button"
              onClick={fetchMobileBillers}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Refresh
            </button>
          </div>

          {loadingBillers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : billers.length === 0 ? (
            <div className="text-center text-slate-500 py-12 space-y-2">
              <Phone className="w-12 h-12 mx-auto text-emerald-200" />
              <p>No mobile providers found</p>
              <p className="text-xs">We will show them here once they are active.</p> 
            </div>
          ) : (
            <div className="space-y-3">
              {billers.map((biller) => (
                <button
                  key={biller.biller_id}
                  type="button"
                  onClick={() => handleBillerClick(biller)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                    selectedBiller?.biller_id === biller.biller_id
                      ? 'border-emerald-500 bg-emerald-50 shadow-inner'
                      : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mobileCategoryConfig.bgColor}`}>
                    <Phone className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 truncate">{biller.name}</p>
                    <p className="text-xs text-slate-500">{mobileCategoryConfig.label}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mobileCategoryConfig.bgColor}`}>
              <Phone className={`w-6 h-6 ${mobileCategoryConfig.color}`} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Recharge</p>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedBiller ? selectedBiller.name : 'Select a provider to continue'}
              </h2>
            </div>
          </div>

          {!selectedBiller && (
            <div className="text-sm text-slate-500">
              Choose a network on the left to activate the recharge form and confirm with your agent PIN.
            </div>
          )}

          {selectedBiller && (
            <div className="space-y-4">
              {paySuccess && (
                <TransactionSummaryModal
                  isOpen={!!paySuccess}
                  onClose={() => {
                    setPaySuccess(null);
                    setStep(1);
                    setFormData({ reference: '', amount: '', epin: '' });
                  }}
                  title="Recharge Successful"
                  accountLabel="Provider"
                  account={paySuccess.biller_name || selectedBiller.name}
                  amount={paySuccess.amount || formData.amount}
                  charge={paySuccess.charge || '0.00'}
                  transactionId={paySuccess.transaction_id || paySuccess.transaction_reference || 'N/A'}
                  reference={paySuccess.reference || formData.reference}
                  time={paySuccess.created_at}
                />
              )}

              {!paySuccess && (
                <>
                  {step === 1 ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700">Customer Reference</label>
                        <input
                          required
                          type="text"
                          value={formData.reference}
                          onChange={(event) => setFormData({ ...formData, reference: event.target.value })}
                          placeholder="Enter phone or account number"
                          className="mt-1 w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700">Amount </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></span>
                          <input
                            required
                            type="number"
                            min="1"
                            step="0.01"
                            value={formData.amount}
                            onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                            placeholder="0.00"
                            className="mt-1 w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-lg font-semibold"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all"
                      >
                        Review &amp; Confirm
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePay} className="space-y-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Provider</span>
                          <span className="font-semibold text-slate-900">{selectedBiller.name}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Reference</span>
                          <span className="font-semibold text-slate-900">{formData.reference || '—'}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Amount</span>
                          <span className="font-semibold text-slate-900">
                            ৳{Number(formData.amount || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Charge</span>
                          <span className="font-semibold text-emerald-600">৳0.00</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700">Agent PIN</label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            required
                            type="password"
                            maxLength={5}
                            pattern="\d{5}"
                            placeholder="•••••"
                            value={formData.epin}
                            onChange={(event) =>
                              setFormData({ ...formData, epin: event.target.value.replace(/\D/g, '') })
                            }
                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none tracking-[0.45em] text-center font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 py-3 border border-slate-200 rounded-2xl font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={paying || formData.epin.length !== 5}
                          className="flex-[2] py-3 rounded-2xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {paying ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5" />
                          )}
                          {paying ? 'Sending...' : 'Confirm Recharge'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <section className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">History</p>
            <h2 className="text-xl font-bold text-slate-900">Recent Mobile Recharges</h2>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Agent</span>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : !hasMobileHistory ? (
          <div className="text-center text-slate-500 py-10 space-y-2">
            <CreditCard className="w-12 h-12 mx-auto text-slate-300" />
            <p>No recharges recorded yet</p>
            <p className="text-xs">Transactions will appear once the first recharge completes.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((payment) => (
              <div key={payment.bill_payment_id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mobileCategoryConfig.bgColor}`}>
                    <Phone className={`w-5 h-5 ${mobileCategoryConfig.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 truncate">{payment.biller_name}</p>
                    <p className="text-xs text-slate-500">{formatDate(payment.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">-৳{Number(payment.amount || 0).toFixed(2)}</p>
                  <p
                    className={`text-xs font-semibold ${
                      payment.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'
                    }`}
                  >
                    {payment.status === 'completed' ? 'Completed' : payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
