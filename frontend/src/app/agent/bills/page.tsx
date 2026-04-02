'use client';

import React, { useEffect, useState } from 'react';
import { billAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import {
  CreditCard, Zap, Droplet, Wifi, Phone, Tv, Flame,
  ArrowLeft, Loader2, Lock, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';

// ── Types ────────────────────────────────────────────
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
}

// ── Category config ──────────────────────────────────
const categoryConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  electricity: { icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Electricity' },
  water: { icon: Droplet, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Water' },
  internet: { icon: Wifi, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Internet' },
  mobile: { icon: Phone, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Mobile' },
  tv_cable: { icon: Tv, color: 'text-red-600', bgColor: 'bg-red-100', label: 'TV/Cable' },
  gas: { icon: Flame, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Gas' },
};

export default function AgentBillsPage() {
  // ── State ──────────────────────────────────────────
  const toast = useToast();
  const [view, setView] = useState<'categories' | 'billers' | 'pay'>('categories');
  const [step, setStep] = useState(1); // 1: Info, 2: Review
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [billers, setBillers] = useState<Biller[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [history, setHistory] = useState<BillPayment[]>([]);
  const [loadingBillers, setLoadingBillers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<any>(null);

  const [formData, setFormData] = useState({
    reference: '',
    amount: '',
    epin: '',
  });

  // ── Fetch history on load ──────────────────────────
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await billAPI.getHistory();
      const data = response.data?.data || [];
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch bill history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Select a category → fetch billers ──────────────
  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category);
    setView('billers');
    setLoadingBillers(true);

    try {
      const response = await billAPI.getBillersByCategory(category);
      setBillers(response.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load billers');
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
      setView('categories');
    } finally {
      setLoadingBillers(false);
    }
  };

  // ── Select a biller → show pay form ────────────────
  const handleBillerClick = (biller: Biller) => {
    setSelectedBiller(biller);
    setFormData({ reference: '', amount: '', epin: '' });
    setPaySuccess(null);
    setStep(1);
    setView('pay');
  };

  // ── Submit payment ─────────────────────────────────
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (response.data.success) {
        setPaySuccess(response.data.data);
        toast.success(response.data.message || 'Bill paid successfully!');
        setFormData({ reference: '', amount: '', epin: '' });
        fetchHistory();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bill payment failed');
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setPaying(false);
    }
  };

  // ── Go back ────────────────────────────────────────
  const goBack = () => {
    if (view === 'pay') { 
      if (step === 2) setStep(1);
      else { setView('billers'); setPaySuccess(null); }
    }
    else if (view === 'billers') setView('categories');
  };

  // ── Format date ────────────────────────────────────
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  };

  // ── Get category info ──────────────────────────────
  const getCatConfig = (cat: string) =>
    categoryConfig[cat] || { icon: CreditCard, color: 'text-slate-600', bgColor: 'bg-slate-100', label: cat };

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {view !== 'categories' && (
          <button onClick={goBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
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
          <h1 className="text-3xl font-bold text-gray-900">Pay Bills (Agent)</h1>
          <p className="text-gray-600 mt-1">
            {view === 'categories' && 'Select a category to get started'}
            {view === 'billers' && `Choose a ${getCatConfig(selectedCategory!).label} provider`}
            {view === 'pay' && `Pay ${selectedBiller?.name}`}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* VIEW: Categories                              */}
      {/* ══════════════════════════════════════════════ */}
      {view === 'categories' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => handleCategoryClick(key)}
                className="card hover:shadow-lg transition-all text-center group"
              >
                <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-8 h-8 ${config.color}`} />
                </div>
                <h3 className="font-medium text-gray-900">{config.label}</h3>
              </button>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* VIEW: Billers list                            */}
      {/* ══════════════════════════════════════════════ */}
      {view === 'billers' && (
        <div className="card">
          {loadingBillers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : billers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No billers found for this category</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {billers.map((biller) => {
                const catConf = getCatConfig(biller.category);
                const Icon = catConf.icon;
                return (
                  <button
                    key={biller.biller_id}
                    onClick={() => handleBillerClick(biller)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`w-12 h-12 ${catConf.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${catConf.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{biller.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{catConf.label}</p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* VIEW: Pay Multi-Step Flow                      */}
      {/* ══════════════════════════════════════════════ */}
      {view === 'pay' && selectedBiller && (
        <div className="max-w-lg mx-auto space-y-5">
          {/* Success banner Modal */}
          {paySuccess && (
            <TransactionSummaryModal
              isOpen={true}
              onClose={() => {
                setPaySuccess(null);
                setView('categories');
              }}
              title="Bill Paid Successfully"
              accountLabel="Biller"
              account={paySuccess.biller_name || selectedBiller.name}
              amount={paySuccess.amount || formData.amount}
              charge={paySuccess.charge || '0.00'}
              transactionId={paySuccess.transaction_id || paySuccess.transaction_reference || '0'}
              reference={paySuccess.reference || formData.reference || 'Bill Payment'}
              time={paySuccess.created_at ? new Date(paySuccess.created_at).toLocaleString('en-GB') : undefined}
            />
          )}

          {/* Stepper Indicator */}
          {!paySuccess && (
            <div className="flex items-center justify-between px-4 mb-2">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    step >= s ? 'bg-emerald-600 text-white shadow-lg scale-110' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {s}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${
                    step >= s ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {s === 1 ? 'Information' : 'Review'}
                  </span>
                  {s === 1 && <div className={`w-12 h-1 mx-2 rounded-full transition-colors ${step > 1 ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>
          )}

          {!paySuccess && (
            <div className="card space-y-5 shadow-sm overflow-hidden animate-slideIn">
              {/* Biller info header */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                {(() => {
                  const catConf = getCatConfig(selectedBiller.category);
                  const Icon = catConf.icon;
                  return (
                    <div className={`w-12 h-12 ${catConf.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${catConf.color}`} />
                    </div>
                  );
                })()}
                <div>
                  <p className="font-bold text-slate-800">{selectedBiller.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{getCatConfig(selectedBiller.category).label}</p>
                </div>
              </div>

              {step === 1 ? (
                <div className="space-y-5 animate-fadeIn">
                  {/* Step 1: Input information */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bill Reference / Account Number
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Enter your bill reference number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (৳)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                      <input
                        required
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-semibold outline-none"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (formData.reference && formData.amount) setStep(2);
                      else toast.error('Please fill in all fields');
                    }}
                    className="w-full btn btn-primary bg-emerald-600 hover:bg-emerald-700 py-4 text-lg flex items-center justify-center gap-2 group border-none"
                  >
                    Continue to Review
                    <div className="w-5 h-5 flex items-center justify-center">
                      <ArrowLeft className="w-5 h-5 rotate-180 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePay} className="space-y-5 animate-fadeIn">
                  {/* Step 2: Confirm Execution */}
                  <div className="bg-slate-50 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Biller</span>
                      <span className="font-bold text-slate-900">{selectedBiller.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Reference</span>
                      <span className="font-bold text-slate-900">{formData.reference}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Bill Amount</span>
                      <span className="font-bold text-slate-900">৳{parseFloat(formData.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Charge</span>
                      <span className="font-bold text-emerald-600">৳0.00</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-slate-900 font-bold">Total Deduction</span>
                      <span className="text-xl font-black text-emerald-600">৳{parseFloat(formData.amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">Confirm with 5-Digit ePin</label>
                    <div className="relative max-w-[240px] mx-auto">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        autoFocus
                        type="password"
                        maxLength={5}
                        pattern="\d{5}"
                        placeholder="•••••"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-xl tracking-[0.3em] font-mono outline-none"
                        value={formData.epin}
                        onChange={(e) => setFormData({ ...formData, epin: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      disabled={paying || formData.epin.length !== 5}
                      type="submit"
                      className="flex-[2] btn btn-primary bg-emerald-600 hover:bg-emerald-700 py-4 text-lg flex items-center justify-center gap-2 border-none"
                    >
                      {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      {paying ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* RECENT BILL PAYMENTS (always visible)         */}
      {/* ══════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Bill Payments (Agent)</h2>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No bill payments yet</p>
            <p className="text-sm mt-2">Your bill payment history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((payment) => {
              const catConf = getCatConfig(payment.biller_category);
              const Icon = catConf.icon;
              return (
                <div key={payment.bill_payment_id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${catConf.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${catConf.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{payment.biller_name}</p>
                      <p className="text-xs text-slate-500">{formatDate(payment.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">-৳{parseFloat(payment.amount).toFixed(2)}</p>
                    <p className={`text-xs font-medium ${payment.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {payment.status === 'completed' ? '✓ Paid' : payment.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}