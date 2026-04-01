'use client';

import { useState, useEffect } from 'react';
import { transactionAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import IncomingRequests from '@/components/IncomingRequests';
import { useToast } from '@/contexts/toastcontext';
import { 
  HandCoins, 
  Hash, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';

interface PendingRequest {
  request_id: string;
  requestee_phone: string; 
  amount: number;
  status: 'requested' | 'declined' | 'cancelled' | 'expired' | 'paid';
  created_at: string;
}

export default function RequestMoneyPage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sentRequests, setSentRequests] = useState<PendingRequest[]>([]);
  
  const [formData, setFormData] = useState({
    recipientPhone: '',
    amount: '',
    message: ''
  });

  // Load sent requests on mount
  useEffect(() => {
    loadSentRequests();
  }, []);

  const loadSentRequests = async () => {
    try {
      const response = await transactionAPI.getSentRequests();
      setSentRequests(response.data.data);
    } catch (err) {
      console.error("Error loading requests", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipientPhone || !formData.amount) return;

    setLoading(true);
    try {
      await transactionAPI.request({
        recipientPhone: formData.recipientPhone,
        amount: parseFloat(formData.amount),
        message: formData.message
      });
      toast.success('Request sent successfully!');
      setFormData({ recipientPhone: '', amount: '', message: '' });
      loadSentRequests(); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      
      {/* --- Section 1: Incoming Requests (Things you need to PAY) --- */}
      {/* This component fetches its own data from transactionAPI.getIncomingRequests */}
      <IncomingRequests />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- Section 2: Request Form (ASKING for money) --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Request Money</h1>
              <p className="text-slate-500 text-sm">Ask another user to send money to your wallet.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-5 shadow-sm border-slate-200">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Recipient Phone Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="text"
                  placeholder="01XXXXXXXXX"
                  className="input-field pl-10 h-12"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (৳)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  className="input-field pl-10 h-12 text-lg font-semibold"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Reference / Note</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  rows={3}
                  placeholder="What is this request for?"
                  className="input-field pl-10 pt-2"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
              Send Request
            </button>
          </form>
        </div>

        {/* --- Section 3: Recent Sent Requests (Status Tracking) --- */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Sent Requests
          </h2>
          
          <div className="space-y-3">
            {fetching ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
            ) : sentRequests.length === 0 ? (
              <div className="card p-8 text-center border-dashed border-2 bg-slate-50/50">
                <p className="text-slate-400 text-sm">No recent requests sent</p>
              </div>
            ) : (
              sentRequests.map((req) => (
                <div key={req.request_id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-slate-800">{req.requestee_phone}</p>
                    <p className="text-sm font-bold text-indigo-600">৳{req.amount}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      {new Date(req.created_at).toLocaleDateString()}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      req.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                      req.status === 'declined' ? 'bg-rose-100 text-rose-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}