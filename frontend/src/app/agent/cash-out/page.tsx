'use client';

import { useState } from 'react';
import { transactionAPI } from '@/lib/api';
import { Upload, Hash, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/contexts/toastcontext';

export default function CashOutPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    userPhone: '',
    amount: '',
    epin: '',
  });

  // NOTE: Cash-out is initiated by the USER (the user calls /cash-out with the agentPhone).
  // From the agent's side, this page could serve as a "guide" or
  // you could build it so the agent can also initiate a cash-out on behalf of the user.
  // For now, this shows a simple interface that tells the user to initiate from their end.

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash Out</h1>
          <p className="text-slate-500 text-sm">Help users withdraw cash from their wallet</p>
        </div>
      </div>

      <div className="card space-y-5 shadow-sm border-slate-200">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-bold text-amber-800 mb-1">How Cash Out Works</h3>
          <p className="text-sm text-amber-700">
            The <strong>user</strong> initiates a cash-out from their app by entering your agent phone number.
            The amount (+ 1.5% fee) is deducted from their wallet and credited to yours.
            You then hand the user the cash.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Your Agent Details</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Give this phone number to the user:</p>
              <p className="text-lg font-bold text-slate-900 font-mono tracking-wider">
                Ask them to use your registered phone number
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800">Steps for the User:</h3>
          <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1.5">
            <li>Open their ClickPay app and go to <strong>Cash Out</strong></li>
            <li>Enter your agent phone number</li>
            <li>Enter the withdrawal amount</li>
            <li>Confirm with their 5-digit ePin</li>
            <li>You&apos;ll see the deposit in your transaction history</li>
            <li>Hand the user the cash amount</li>
          </ol>
        </div>
      </div>
    </div>
  );
}