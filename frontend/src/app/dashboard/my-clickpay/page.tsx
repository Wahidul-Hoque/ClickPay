"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Phone, Users, CreditCard, Landmark, Coins, TrendingUp, CheckCircle2, ChevronRight, ChevronDown, Star, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { transactionAPI, favoriteAPI, paymentMethodAPI, loanAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';

// Mock Data
// Removed MOCK_FAVORITE data since we use API now

const MOCK_TOPUP_METHODS = [
  { id: 1, type: 'bank', last4: '1234', instName: 'City Bank', logo: '🏦' },
  { id: 2, type: 'card', last4: '5678', instName: 'Visa Platinum', logo: '💳' },
];

const Gauge = ({ value, max, label }: { value: number; max: number; label: string }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="flex flex-col items-center flex-shrink-0 w-36">
      <div className="relative w-28 h-14 overflow-hidden mb-2">
        <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#E0E7FF" // indigo-100
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#4F46E5" // indigo-600
            strokeWidth="12"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - percentage}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute bottom-0 w-full text-center">
          <span className="text-sm font-semibold text-slate-800">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <p className="text-[11px] text-slate-800 font-medium truncate w-full text-center mb-1">{label}</p>
      <div className="text-center font-mono">
        <p className="text-sm font-bold text-indigo-600 tracking-tighter">৳{value.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
        <p className="text-[10px] text-slate-500 tracking-tighter">/৳{max.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
      </div>
    </div>
  );
};



export default function MyClickPayPage() {
  const toast = useToast();
  const [favoriteNumbers, setFavoriteNumbers] = useState<any[]>([]);
  const [favoriteAgents, setFavoriteAgents] = useState<any[]>([]);
  const [topupMethods, setTopupMethods] = useState<any[]>([]);
  const [loanSummary, setLoanSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [limitType, setLimitType] = useState<'Daily' | 'Monthly'>('Daily');
  const [spentData, setSpentData] = useState({
    addMoney: 0,
    clickpayToBank: 0,
    cardToOther: 0
  });

  // Modal states
  const [isAddNumberOpen, setIsAddNumberOpen] = useState(false);
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [newFavName, setNewFavName] = useState('');
  const [newFavPhone, setNewFavPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, [limitType]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const [numRes, agentRes, methodRes, loanRes, txnRes] = await Promise.all([
        favoriteAPI.getFavorites('number'),
        favoriteAPI.getFavorites('agent'),
        paymentMethodAPI.getMyMethods(),
        loanAPI.getStatus(),
        transactionAPI.getHistory({ limit: 100 })
      ]);
      setFavoriteNumbers(numRes.data.data || []);
      setFavoriteAgents(agentRes.data.data || []);
      setTopupMethods(methodRes.data.data || []);
      setLoanSummary(loanRes.data.data || null);

      // Compute spent data
      const txns = txnRes.data.data || [];
      const now = new Date();
      let addMoneySpent = 0;
      let toBankSpent = 0;
      let toOtherSpent = 0;

      txns.forEach((t: any) => {
        const d = new Date(t.created_at);
        const matchesDaily = limitType === 'Daily' 
          ? d.toDateString() === now.toDateString() 
          : d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

        if (matchesDaily) {
          if (t.transaction_type === 'bank_transfer' && t.direction === 'credit') {
            addMoneySpent += parseFloat(t.amount);
          } else if (t.transaction_type === 'cash_out') {
            toBankSpent += parseFloat(t.amount);
          } else if (t.transaction_type === 'transfer') {
            toOtherSpent += parseFloat(t.amount);
          }
        }
      });
      setSpentData({
        addMoney: addMoneySpent,
        clickpayToBank: toBankSpent,
        cardToOther: toOtherSpent
      });
    } catch (err: any) {
      toast.error('Failed to load dashboard data');
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFavorite = async (type: 'number' | 'agent') => {
    if (!newFavName.trim() || !newFavPhone.trim()) {
      toast.error('Name and Phone are required');
      return;
    }
    try {
      setIsSubmitting(true);
      await favoriteAPI.addFavorite({ type, name: newFavName, phone: newFavPhone });
      toast.success(`Favorite ${type} added successfully!`);
      // Reset
      setNewFavName('');
      setNewFavPhone('');
      if (type === 'number') setIsAddNumberOpen(false);
      else setIsAddAgentOpen(false);
      // Refresh
      fetchFavorites();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add favorite');
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await favoriteAPI.toggleFavorite(id);
      fetchFavorites();
      toast.success("Favorite status updated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans animate-fadeIn">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">My ClickPay</h1>
            </div>
            <p className="text-slate-500 font-medium">Manage your personalized financial ecosystem.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            
            {/* Limit Chart Section */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" /> Limits
                  </h2>
                  <div className="w-px h-5 bg-slate-200"></div>
                  <div className="relative">
                    <select 
                      className="appearance-none bg-transparent text-indigo-600 font-bold pr-5 cursor-pointer outline-none text-sm"
                      value={limitType}
                      onChange={(e) => setLimitType(e.target.value as 'Daily' | 'Monthly')}
                    >
                      <option value="Daily">Daily</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-indigo-600 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start overflow-x-auto gap-3 custom-scrollbar pb-2">
                 <Gauge 
                   value={spentData.addMoney} 
                   max={limitType === 'Daily' ? 50000 : 150000} 
                   label="Add Money" 
                 />
                 <Gauge 
                   value={spentData.clickpayToBank} 
                   max={limitType === 'Daily' ? 50000 : 150000} 
                   label="ClickPay to Bank" 
                 />
                 <Gauge 
                   value={spentData.cardToOther} 
                   max={limitType === 'Daily' ? 10000 : 50000} 
                   label="Card to Others" 
                 />
              </div>
            </section>
            
            {/* Favorite Numbers */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-indigo-500" /> Saved Numbers
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {favoriteNumbers.length} / 5 Added
                  </p>
                </div>
                {favoriteNumbers.length < 5 && (
                  <button 
                    onClick={() => setIsAddNumberOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors font-bold text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add New
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {favoriteNumbers.map(fav => (
                  <div key={fav.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">
                        {fav.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{fav.name}</p>
                        <p className="text-xs font-mono text-slate-400 font-semibold tracking-widest">{fav.phone}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleFavorite(fav.id)}
                      disabled={isLoading}
                      className={`p-2 rounded-xl transition-all ${fav.is_favorite ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'}`}
                      title={fav.is_favorite ? "Remove from favorites" : "Mark as favorite"}
                    >
                      <Star className={`w-5 h-5 ${fav.is_favorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                ))}
                {favoriteNumbers.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">
                    No numbers saved yet.
                  </div>
                )}
                {isLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                )}
              </div>
            </section>

            {/* Favorite Agents */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" /> Favorite Agents
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {favoriteAgents.length} / 2 Added
                  </p>
                </div>
                {favoriteAgents.length < 2 && (
                  <button 
                    onClick={() => setIsAddAgentOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors font-bold text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Agent
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {favoriteAgents.map(ag => (
                  <div key={ag.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-100 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{ag.name}</p>
                        <p className="text-xs font-mono text-slate-400 font-semibold tracking-widest">{ag.phone}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                  </div>
                ))}
                {favoriteAgents.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">
                    No favorite agents added yet.
                  </div>
                )}
                {isLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            
            {/* Top-up Methods */}
            <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none"></div>
              
              <div className="relative z-10 flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2 text-white">
                    <Landmark className="w-5 h-5 text-indigo-400" /> Payment Methods
                  </h2>
                  <p className="text-xs text-indigo-200/70 font-bold uppercase tracking-widest mt-1">
                    Direct Top-up Sources
                  </p>
                </div>
                <Link 
                  href="/dashboard/payment_methods/link"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all font-bold text-sm border border-white/10"
                >
                  <Plus className="w-4 h-4" /> Link New
                </Link>
              </div>

              <div className="relative z-10 space-y-4">
                {topupMethods.map(method => {
                  const name = method.bank_name || method.network_name || 'Bank/Card';
                  const identifier = method.identifier ? String(method.identifier).slice(-4) : '****';
                  return (
                  <Link 
                    href={`/dashboard/payment_methods/add-money`} 
                    key={method.method_id || method.id} 
                    className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer group block w-full text-left"
                  >
                    <div className="flex items-center gap-5">
                      <div className="text-3xl bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center">
                        {method.method_type === 'card' ? '💳' : (method.method_type === 'mobile_banking' ? '📱' : '🏦')}
                      </div>
                      <div>
                        <p className="font-bold text-white tracking-wide">{name}</p>
                        <p className="text-xs font-mono text-indigo-200/70 tracking-widest mt-1">
                          •••• {identifier}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </Link>
                  );
                })}
                {topupMethods.length === 0 && (
                  <div className="text-center py-6 text-indigo-200/50 text-sm font-medium border border-dashed border-white/20 rounded-2xl">
                    No connected banks or cards.
                  </div>
                )}
              </div>
            </section>

            {/* Loan Summary */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" /> Loan Summary
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Credit Overview
                  </p>
                </div>
                <Link href="/dashboard/loans" className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-100 transition-colors font-bold text-sm">
                  View History
                </Link>
              </div>

              {loanSummary?.activeLoan ? (
                <div className="bg-gradient-to-tr from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-100/50">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black text-slate-700 tracking-wider uppercase">{loanSummary.activeLoan.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Due Date</p>
                      <p className="text-sm font-bold text-rose-600">
                        {new Date(loanSummary.activeLoan.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Due</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                        ৳{Number(parseFloat(loanSummary.activeLoan.principal_amount) * (1 + parseFloat(loanSummary.activeLoan.interest_rate))).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 font-medium">Principal: ৳{Number(loanSummary.activeLoan.principal_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                    <Link href="/dashboard/loans" className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 inline-block text-center cursor-pointer">
                      Pay Now
                    </Link>
                  </div>
                </div>
              ) : loanSummary?.latestApplication && loanSummary.latestApplication.decision_status === 'submitted' ? (
                <div className="bg-gradient-to-tr from-slate-50 to-indigo-50 rounded-3xl p-6 border border-indigo-100/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Application Under Review</h3>
                      <p className="text-xs text-slate-500 font-medium">We are processing your loan request.</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Requested Amount</p>
                      <h3 className="text-2xl font-black text-indigo-900 tracking-tighter">
                        ৳{Number(loanSummary.latestApplication.requested_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </h3>
                    </div>
                    <Link href="/dashboard/loans" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 inline-block text-center cursor-pointer">
                      Check Status
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Coins className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium text-sm">You have no active loans.</p>
                  <p className="text-xs text-slate-400 mt-1">Maintain good transaction volume to unlock limits.</p>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>

      {/* MODALS */}
      {isAddNumberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add Saved Number</h3>
              <button onClick={() => setIsAddNumberOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 mb-1.5 block">Name</label>
                <input 
                  type="text" 
                  value={newFavName}
                  onChange={(e) => setNewFavName(e.target.value)}
                  placeholder="e.g. Mom"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-1.5 block">Phone Number</label>
                <input 
                  type="tel" 
                  value={newFavPhone}
                  onChange={(e) => setNewFavPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium font-mono"
                />
              </div>
              <button 
                onClick={() => handleAddFavorite('number')}
                disabled={isSubmitting}
                className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Number'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddAgentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add Favorite Agent</h3>
              <button onClick={() => setIsAddAgentOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 mb-1.5 block">Agent Name/Description</label>
                <input 
                  type="text" 
                  value={newFavName}
                  onChange={(e) => setNewFavName(e.target.value)}
                  placeholder="e.g. Gulshan Point"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 mb-1.5 block">Agent Number</label>
                <input 
                  type="tel" 
                  value={newFavPhone}
                  onChange={(e) => setNewFavPhone(e.target.value)}
                  placeholder="e.g. 018XXXXXXXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium font-mono"
                />
              </div>
              <button 
                onClick={() => handleAddFavorite('agent')}
                disabled={isSubmitting}
                className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
