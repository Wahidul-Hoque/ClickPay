'use client';

import { useEffect, useState } from 'react';
import { billAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import {
  CreditCard, Zap, Droplet, Wifi, Phone, Tv, Flame,
  ArrowLeft, Loader2, Lock, CheckCircle2,
} from 'lucide-react';

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
  water:       { icon: Droplet, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Water' },
  internet:    { icon: Wifi, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Internet' },
  mobile:      { icon: Phone, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Mobile' },
  tv_cable:    { icon: Tv, color: 'text-red-600', bgColor: 'bg-red-100', label: 'TV/Cable' },
  gas:         { icon: Flame, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Gas' },
};

export default function BillsPage() {
  // ── State ──────────────────────────────────────────
  const toast = useToast();
  const [view, setView] = useState<'categories' | 'billers' | 'pay'>('categories');
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
    } catch (error) {
      toast.error('Failed to load billers');
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bill payment failed');
    } finally {
      setPaying(false);
    }
  };

  // ── Go back ────────────────────────────────────────
  const goBack = () => {
    if (view === 'pay') { setView('billers'); setPaySuccess(null); }
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
          <h1 className="text-3xl font-bold text-gray-900">Pay Bills</h1>
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

      {/* ═════���════════════════════════════════════════ */}
      {/* VIEW: Pay form                                */}
      {/* ══════════════════════════════════════════════ */}
      {view === 'pay' && selectedBiller && (
        <div className="max-w-lg mx-auto space-y-5">
          {/* Success banner */}
          {paySuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-bold">Payment Successful!</p>
              </div>
              <div className="text-sm space-y-1">
                <p>Amount: <span className="font-semibold">৳{paySuccess.amount}</span></p>
                <p>To: <span className="font-semibold">{paySuccess.biller_name}</span></p>
                <p>Reference: <span className="font-mono text-xs">{paySuccess.reference}</span></p>
                <p>New Balance: <span className="font-semibold">৳{paySuccess.new_balance?.toFixed(2)}</span></p>
              </div>
            </div>
          )}

          {/* Payment form */}
          <form onSubmit={handlePay} className="card space-y-5 shadow-sm">
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

            {/* Reference / Bill Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Bill Reference / Account Number
              </label>
              <input
                required
                type="text"
                placeholder="Enter your bill reference number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>

            {/* Amount */}
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-semibold"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            {/* ePin */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Your 5-Digit ePin</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="password"
                  maxLength={5}
                  pattern="\d{5}"
                  placeholder="•••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-xl tracking-[0.3em] font-mono"
                  value={formData.epin}
                  onChange={(e) => setFormData({ ...formData, epin: e.target.value.replace(/\D/g, '') })}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={paying}
              type="submit"
              className="w-full btn btn-primary py-4 text-lg flex items-center justify-center gap-2"
            >
              {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              {paying ? 'Processing...' : `Pay ৳${formData.amount || '0.00'}`}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* RECENT BILL PAYMENTS (always visible)         */}
      {/* ══════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Bill Payments</h2>
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