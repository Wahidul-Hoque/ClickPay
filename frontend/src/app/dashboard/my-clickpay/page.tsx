"use client";

import React, { useState } from 'react';
import { ShieldAlert, Plus, Phone, Users, CreditCard, Landmark, Coins, TrendingUp, CheckCircle2, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';

// Mock Data
const MOCK_FAVORITE_NUMBERS = [
  { id: 1, phone: '01711223344', name: 'Mom' },
  { id: 2, phone: '01855667788', name: 'Karim Bhai' },
  { id: 3, phone: '01911223344', name: 'Rahim' },
];

const MOCK_FAVORITE_AGENTS = [
  { id: 1, phone: '01999887766', name: 'Gulshan Agent Point' },
];

const MOCK_TOPUP_METHODS = [
  { id: 1, type: 'bank', last4: '1234', instName: 'City Bank', logo: '🏦' },
  { id: 2, type: 'card', last4: '5678', instName: 'Visa Platinum', logo: '💳' },
];

const MOCK_LOAN_SUMMARY = {
  active: true,
  principal: 10000,
  due_amount: 10900,
  due_date: '15 Apr 2026',
  status: 'In Good Standing'
};

export default function MyClickPayPage() {
  const [favoriteNumbers] = useState(MOCK_FAVORITE_NUMBERS);
  const [favoriteAgents] = useState(MOCK_FAVORITE_AGENTS);
  const [topupMethods] = useState(MOCK_TOPUP_METHODS);
  const [loanSummary] = useState(MOCK_LOAN_SUMMARY);

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
            
            {/* Favorite Numbers */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-indigo-500" /> Favorite Numbers
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {favoriteNumbers.length} / 5 Added
                  </p>
                </div>
                {favoriteNumbers.length < 5 && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors font-bold text-sm">
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
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                ))}
                {favoriteNumbers.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">
                    No favorite numbers added yet.
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
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors font-bold text-sm">
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
                {favoriteAgents.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">
                    No favorite agents added yet.
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
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all font-bold text-sm border border-white/10">
                  <Plus className="w-4 h-4" /> Link New
                </button>
              </div>

              <div className="relative z-10 space-y-4">
                {topupMethods.map(method => (
                  <div key={method.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-5">
                      <div className="text-3xl bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center">
                        {method.logo}
                      </div>
                      <div>
                        <p className="font-bold text-white tracking-wide">{method.instName}</p>
                        <p className="text-xs font-mono text-indigo-200/70 tracking-widest mt-1">
                          •••• {method.last4}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
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
                <button className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-100 transition-colors font-bold text-sm">
                  View Details
                </button>
              </div>

              {loanSummary.active ? (
                <div className="bg-gradient-to-tr from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-100/50">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black text-slate-700 tracking-wider uppercase">{loanSummary.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Due Date</p>
                      <p className="text-sm font-bold text-rose-600">{loanSummary.due_date}</p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Due</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                        ৳{loanSummary.due_amount.toLocaleString()}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 font-medium">Principal: ৳{loanSummary.principal.toLocaleString()}</p>
                    </div>
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95">
                      Pay Now
                    </button>
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
    </div>
  );
}
