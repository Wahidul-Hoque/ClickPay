'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, History, AlertCircle, X, Loader2, Landmark, ArrowLeft, Info, HelpCircle } from 'lucide-react';
import { loanAPI, systemAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';
import { TransactionSummaryModal } from '@/components/TransactionSummaryModal';

export default function LoansPage() {
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1: Input, 2: Review
  const [successData, setSuccessData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [interestRate, setInterestRate] = useState<number>(0.09); // Default fallback

  // Modal State
  const [repayModal, setRepayModal] = useState<{ open: boolean; loanId: string | null }>({
    open: false,
    loanId: null,
  });

  const loadData = async () => {
    try {
      const res = await (loanAPI as any).getStatus();
      setData(res.data.data);
      
      const settingsRes = await systemAPI.getSettings();
      if (settingsRes.data.success) {
        setSettings(settingsRes.data.settings);
        if (settingsRes.data.settings.loan_interest_rate) {
          setInterestRate(settingsRes.data.settings.loan_interest_rate);
        }
      }
    } catch (err: any) {
      toast.error("Failed to load loan data");
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApplyLoan = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 500 || numAmount > data.limit) {
      toast.error(`Please enter an amount between ৳500 and ৳${data.limit}`);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await (loanAPI as any).apply({ amount: numAmount });
      if (response.data.success) {
        setSuccessData({
          ...response.data.data,
          amount: numAmount,
          reason: 'General Purpose Loan'
        });
        toast.success("Loan Application Submitted!");
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Application failed");
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepaySubmit = async () => {
    if (!repayModal.loanId) return;
    
    setIsProcessing(true);
    toast.info("Processing repayment...");

    try {
      await (loanAPI as any).repay(repayModal.loanId);
      toast.success("Repaid Successfully!");
      setRepayModal({ open: false, loanId: null });
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Repayment failed";
      toast.error(msg);
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: any) => {
          toast.error(e.message || 'Validation error');
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fadeIn">
      <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Loan Management</h1>

      {/* Success Modal */}
      {successData && (
        <TransactionSummaryModal
          isOpen={true}
          onClose={() => {
            setSuccessData(null);
            setFormStep(1);
            setAmount('');
          }}
          title="Loan Application Submitted"
          accountLabel="Status"
          account="Pending Approval"
          amount={successData.amount}
          charge="0.00"
          transactionId={successData.loan_id || 'PENDING'}
          reference="Short-term Loan"
          time={new Date().toLocaleString()}
        />
      )}

      {/* ACTIVE LOAN SECTION */}
      {data.activeLoan ? (
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden animate-slideIn">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-indigo-100 font-bold uppercase text-xs tracking-widest">Active Loan</p>
              <h2 className="text-3xl font-black mt-2 ">
                ৳{(data.activeLoan.principal_amount * (1 + parseFloat(data.activeLoan.interest_rate))).toFixed(2)} Due
              </h2>
              <p className="text-indigo-100 text-xs font-bold mt-1">
                Due Date: {new Date(data.activeLoan.due_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-3">
                <p className="text-xs font-bold bg-indigo-500/30 backdrop-blur-md inline-block px-3 py-1 rounded-full uppercase ">
                  Principal: ৳{data.activeLoan.principal_amount}
                </p>
                {data.activeLoan.status === 'defaulted' && (
                  <p className="text-xs font-bold bg-rose-500/50 backdrop-blur-md inline-block px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <AlertCircle size={12} /> Defaulted
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setRepayModal({ open: true, loanId: data.activeLoan.loan_id })}
              className="w-full md:w-auto bg-white text-indigo-700 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Repay Now
            </button>
          </div>
        </div>
      ) : data.latestApplication?.decision_status === 'submitted' ? (
        <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[2rem] flex items-center gap-6 animate-slideIn">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
            <Clock className="text-amber-600 w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="font-black text-amber-800 text-xl tracking-tight">Application Pending</h3>
            <p className="text-amber-700 font-medium">Requested ৳{data.latestApplication.requested_amount}. Our admins are reviewing it.</p>
          </div>
        </div>
      ) : !successData && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden animate-slideIn group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Landmark size={120} />
            </div>

            {formStep === 1 ? (
              <div className="animate-fadeIn relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Available Loan Limit</p>
                  <HelpCircle size={14} className="text-slate-300 cursor-help" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">৳{data.limit}</h2>
                
                <div className="mt-8 space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Enter Requested Amount</label>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                        <input 
                          type="number" 
                          className="w-full bg-slate-50 border border-slate-200 p-5 pl-10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xl transition-all" 
                          placeholder="e.g. 5000" 
                          value={amount}
                          onChange={e => setAmount(e.target.value)} 
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const val = Number(amount);
                          if (val >= 500 && val <= data.limit) setFormStep(2);
                          else toast.error(`Please enter between 500 and ${data.limit}`);
                        }} 
                        disabled={!amount}
                        className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                      >
                        Calculate & Review
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 font-medium italic">Minimum loan amount is ৳500</p>
                </div>
              </div>
            ) : (
              <div className="animate-fadeIn relative z-10">
                <button onClick={() => setFormStep(1)} className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-6 hover:underline">
                  <ArrowLeft size={14} /> Back to Edit
                </button>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-6">Review Loan Summary</h3>
                
                <div className="bg-slate-50 rounded-2xl p-6 space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Requested Amount</span>
                    <span className="font-bold text-slate-900">৳{Number(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Interest Rate (Annual Equivalent)</span>
                    <span className="font-bold text-emerald-600">{(interestRate * 100).toFixed(0)}% Fixed</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Interest Amount</span>
                    <span className="font-bold text-slate-900">৳{(Number(amount) * interestRate).toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-900 font-black">Total Repayment Amount</span>
                    <span className="text-2xl font-black text-indigo-600">৳{(Number(amount) * (1 + interestRate)).toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 flex items-start gap-3">
                  <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    By clicking "Confirm & Apply", you agree to the repayment of the total amount within the specified deadline of 30 days. The funds will be credited to your wallet instantly upon admin approval.
                  </p>
                </div>

                <button 
                  disabled={isProcessing}
                  onClick={handleApplyLoan}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle size={20} />}
                  Confirm & Apply Now
                </button>
              </div>
            )}
        </div>
      )}

      {/* HISTORY */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
          <History className="w-6 h-6 text-indigo-600"/> Loan History
        </h3>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Principal</th>
                <th className="px-8 py-5">Total Paid</th>
                <th className="px-8 py-5">Repaid Date</th>
                <th className="px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.history.map((h: any) => (
                <tr key={h.loan_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-800">৳{h.principal_amount}</td>
                  <td className="px-8 py-5 font-bold text-slate-600">৳{(h.principal_amount * (1 + parseFloat(h.interest_rate))).toFixed(2)}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{h.repaid_at ? new Date(h.repaid_at).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-8 py-5 text-right">
                    {h.status === 'repaid' ? (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase">Repaid</span>
                    ) : h.status === 'defaulted' ? (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase">Defaulted</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase">{h.status}</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">No loan history found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- REPAYMENT CONFIRMATION MODAL --- */}
      {repayModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Confirm</h2>
              <button onClick={() => setRepayModal({ open: false, loanId: null })} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <p className="text-slate-500 text-sm font-medium mb-8">
              Are you sure you want to repay this loan? A total of 
              <span className="text-indigo-600 font-bold ml-1">
                ৳{(data.activeLoan.principal_amount * (1 + parseFloat(data.activeLoan.interest_rate))).toFixed(2)}
              </span> (Principal + {(parseFloat(data.activeLoan.interest_rate) * 100).toFixed(0)}% Interest) will be deducted from your wallet.
            </p>

            <div className="flex gap-4">
              <button
                disabled={isProcessing}
                onClick={handleRepaySubmit}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                {isProcessing ? "Processing..." : "Confirm"}
              </button>
              <button
                onClick={() => setRepayModal({ open: false, loanId: null })}
                className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}