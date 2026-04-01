'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, History, AlertCircle, X, Loader2, ArrowRightLeft } from 'lucide-react';
import { loanAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';

export default function LoansPage() {
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal State
  const [repayModal, setRepayModal] = useState<{ open: boolean; loanId: string | null }>({
    open: false,
    loanId: null,
  });

  const loadData = async () => {
    try {
      const res = await (loanAPI as any).getStatus();
      setData(res.data.data);
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

      {/* ACTIVE LOAN SECTION */}
      {data.activeLoan ? (
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-indigo-100 font-bold uppercase text-xm tracking-widest">Active Loan</p>
              <h2 className="text-3xl font-black mt-2 ">
                ৳{(data.activeLoan.principal_amount * 1.09).toFixed(2)} Due
              </h2>
              <p className="mt-3 text-xs font-bold bg-indigo-500/30 backdrop-blur-md inline-block px-3 py-1 rounded-full uppercase ">
                Principal: ৳{data.activeLoan.principal_amount} + 9% Interest
              </p>
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
        <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[2rem] flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
            <Clock className="text-amber-600 w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="font-black text-amber-800 text-xl tracking">Application Pending</h3>
            <p className="text-amber-700 font-medium">Requested ৳{data.latestApplication.requested_amount}. Our admins are reviewing it.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-xm tracking-widest">Your Loan Limit</p>
            <h2 className="text-3xl font-black text-gray-800 tracking">৳{data.limit}</h2>
            <div className="mt-8 flex flex-col md:flex-row gap-4">
                <input 
                  type="number" 
                  className="bg-slate-50 border border-slate-200 p-4 flex-1 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg" 
                  placeholder="Enter amount (min 500)" 
                  onChange={e => setAmount(Number(e.target.value))} 
                />
                <button 
                  onClick={async () => {
                    toast.info("Submitting...");
                    try {
                      await (loanAPI as any).apply({amount});
                      toast.success("Submitted!");
                      loadData();
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || "Failed");
                      if (err.response?.data?.errors) {
                        err.response.data.errors.forEach((e: any) => {
                          toast.error(e.message || 'Validation error');
                        });
                      }
                    }
                  }} 
                  disabled={amount < 500 || amount > data.limit} 
                  className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest disabled:bg-slate-200"
                >
                  Apply Now
                </button>
            </div>
        </div>
      )}

      {/* HISTORY */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
          <History className="w-6 h-6 text-indigo-600"/> Loan History
        </h3>
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
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
                <tr key={h.loan_id}>
                  <td className="px-8 py-5 font-bold text-slate-800">৳{h.principal_amount}</td>
                  <td className="px-8 py-5 font-bold text-slate-600">৳{(h.principal_amount * 1.09).toFixed(2)}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{new Date(h.repaid_at).toLocaleDateString()}</td>
                  <td className="px-8 py-5 text-right">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase">Repaid</span>
                  </td>
                </tr>
              ))}
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
                ৳{(data.activeLoan.principal_amount * 1.09).toFixed(2)}
              </span> (Principal + 9% Interest) will be deducted from your wallet.
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