'use client';

import React, { useState } from 'react';
import { ChevronRight, ArrowLeft, Phone, DollarSign, Lock, AlertCircle, Star, Users, CheckCircle } from 'lucide-react';

interface Contact {
  phone: string;
  name: string;
  is_favorite?: boolean;
}

interface TransactionWizardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  themeColor?: 'primary' | 'indigo' | 'emerald';
  accountLabel: string;
  savedContacts?: Contact[];
  balance?: number;
  calculateFee: (amount: number, recipient: string, isFavorite: boolean) => number;
  onExecute: (data: { recipient: string; amount: number; epin: string; note: string }) => Promise<void>;
  isLoading: boolean;
}

export function TransactionWizard({
  title,
  subtitle,
  icon,
  themeColor = 'primary',
  accountLabel,
  savedContacts = [],
  balance = 0,
  calculateFee,
  onExecute,
  isLoading
}: TransactionWizardProps) {
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [isVerifyingRecipient, setIsVerifyingRecipient] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [epin, setEpin] = useState('');
  const [note, setNote] = useState('');

  const isFavorite = savedContacts.some(c => c.phone === recipient);
  const fee = calculateFee(parseFloat(amount || '0'), recipient, isFavorite);
  const totalAmount = parseFloat(amount || '0') + fee;

  // Determine colors based on theme
  const getThemeClasses = () => {
    switch(themeColor) {
      case 'indigo':
        return {
          bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', text: 'text-indigo-600', 
          border: 'border-indigo-500', focusRing: 'focus:ring-indigo-500', lightBg: 'bg-indigo-50', active: 'active:bg-indigo-700'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', text: 'text-emerald-600', 
          border: 'border-emerald-500', focusRing: 'focus:ring-emerald-500', lightBg: 'bg-emerald-50', active: 'active:bg-emerald-700'
        };
      default:
        return {
          bg: 'bg-primary-600', hover: 'hover:bg-primary-700', text: 'text-primary-600', 
          border: 'border-primary-500', focusRing: 'focus:ring-primary-500', lightBg: 'bg-primary-50', active: 'active:bg-primary-700'
        };
    }
  };
  const theme = getThemeClasses();

  const handleRecipientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;
    setIsVerifyingRecipient(true);
  };

  const confirmRecipient = () => {
    setIsVerifyingRecipient(false);
    setStep(2);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(amount) > 0 && epin.length === 5) {
      setStep(3);
    }
  };

  const handleFinalExecute = () => {
    onExecute({ recipient, amount: parseFloat(amount), epin, note });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 ${theme.lightBg} rounded-full mb-4 shadow-sm`}>
          <div className={`w-8 h-8 ${theme.text}`}>{icon}</div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-gray-600 mt-2">{subtitle}</p>
      </div>

      <div className={`card shadow-xl border-t-4 ${theme.border} overflow-hidden relative min-h-[400px]`}>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)} 
                className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors mr-2"
                disabled={isLoading}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Step {step} of 3
            </span>
          </div>
          <div className="flex space-x-1.5 w-24">
            <div className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${step >= 1 ? theme.bg : 'bg-gray-200'}`} />
            <div className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${step >= 2 ? theme.bg : 'bg-gray-200'}`} />
            <div className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${step >= 3 ? theme.bg : 'bg-gray-200'}`} />
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* STEP 1: RECIPIENT */}
          {step === 1 && (
            <div className="animate-slideInRight">
              <h2 className="text-xl font-bold text-gray-800 mb-6">{accountLabel}</h2>
              
              {!isVerifyingRecipient ? (
                <form onSubmit={handleRecipientSubmit} className="space-y-6">
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={recipient}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 11) setRecipient(val);
                        }}
                        placeholder="01XXXXXXXXX"
                        className={`w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 ${theme.focusRing} focus:border-transparent outline-none transition-all text-lg font-medium shadow-sm`}
                        required
                        autoFocus
                      />
                    </div>
                    
                    {/* Saved Contacts Quick Pick */}
                    {savedContacts.length > 0 && (
                      <div className="mt-6">
                        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                          <Users className="w-4 h-4" /> Recent & Saved
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {savedContacts.map(contact => (
                            <button
                              key={`${contact.phone}-${contact.name}`}
                              type="button"
                              onClick={() => setRecipient(contact.phone)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                                recipient === contact.phone 
                                  ? `${theme.lightBg} ${theme.border} ${theme.text} shadow-sm scale-105` 
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {contact.is_favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                              {contact.name || contact.phone}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!recipient || recipient.length < 11}
                    className={`w-full ${theme.bg} text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl ${theme.hover} ${theme.active} transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2`}
                  >
                    <span>Next step</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </form>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center shadow-inner">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-amber-800 font-bold mb-2">Verify Phone Number</h3>
                    <p className="text-3xl font-black text-gray-900 tracking-widest my-4">{recipient}</p>
                    <p className="text-sm text-amber-700 font-medium">Please confirm this number is exactly correct. Transactions cannot be reversed.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setIsVerifyingRecipient(false)}
                      className="py-4 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                      Make Changes
                    </button>
                    <button
                      type="button"
                      onClick={confirmRecipient}
                      className={`py-4 ${theme.bg} text-white rounded-xl font-bold shadow-lg ${theme.hover} transition-colors flex items-center justify-center gap-2`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      Looks Good
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <div className="animate-slideInRight">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Transaction Details</h2>
                
              </div>
              
              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                {/* Amount */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-gray-700">Amount (BDT) *</label>
                    {balance > 0 && (
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        Bal: ৳{balance.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 ${theme.text}`} />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      className={`w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 ${theme.focusRing} focus:border-transparent text-xl font-black outline-none transition-all shadow-sm`}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                    {[100, 500, 1000, 2000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt.toString())}
                        className={`px-4 py-2 border border-gray-200 rounded-lg whitespace-nowrap text-sm font-bold text-gray-600 hover:${theme.text} hover:border-transparent hover:${theme.lightBg} transition-all active:scale-95`}
                      >
                        ৳{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid for PIN and Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ePin (5 digits) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={epin}
                        onChange={(e) => setEpin(e.target.value)}
                        placeholder="•••••"
                        maxLength={5}
                        className={`w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 ${theme.focusRing} tracking-[0.5em] text-center text-lg font-bold outline-none transition-all shadow-sm`}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What is this for?"
                      maxLength={50}
                      className={`w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 ${theme.focusRing} outline-none transition-all shadow-sm`}
                    />
                  </div>
                </div>
                
                {/* Fee Preview */}
                {parseFloat(amount) > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between mt-6 shadow-inner">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estimated Total</span>
                    <div className="text-right flex flex-col items-end">
                       <span className="text-xs text-gray-500 mb-0.5">Amount + {fee > 0 ? `৳${fee.toFixed(2)} Fee` : 'No Fee'}</span>
                       <span className="font-black text-xl text-gray-900">৳{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {balance > 0 && totalAmount > balance && (
                  <p className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                    Warning: Total amount exceeds your current balance of ৳{balance.toFixed(2)}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!amount || epin.length !== 5 || (balance > 0 && totalAmount > balance)}
                  className={`w-full ${theme.bg} text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl ${theme.hover} transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 mt-8`}
                >
                  <span>Review Final Transaction</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: REVIEW & EXECUTE */}
          {step === 3 && (
            <div className="animate-slideInRight space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Confirm execution</h2>
              
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md p-6 overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-full h-1.5 ${theme.bg}`}></div>
                
                <div className="flex flex-col items-center justify-center py-6 border-b border-gray-100 border-dashed mb-6">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Total Amount</p>
                  <p className={`text-5xl font-black ${theme.text}`}>৳{totalAmount.toFixed(2)}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">To</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{recipient}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Transfer Amount</span>
                    <span className="font-bold text-gray-900">৳{parseFloat(amount).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Platform Fee</span>
                    <span className={`font-bold ${fee === 0 ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md' : 'text-gray-900'}`}>
                      {fee === 0 ? 'FREE' : `৳${fee.toFixed(2)}`}
                    </span>
                  </div>
                  
                  {note && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Reference</span>
                      <span className="font-medium text-gray-700 italic">"{note}"</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleFinalExecute}
                  disabled={isLoading}
                  className={`relative w-full ${theme.bg} overflow-hidden text-white py-5 rounded-xl font-black text-xl shadow-xl hover:shadow-2xl ${theme.hover} transform hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-wait disabled:transform-none flex items-center justify-center space-x-3 group`}
                >
                  <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <span>Tap to Execute</span>
                      <ChevronRight className="w-6 h-6 animate-pulse" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs font-medium text-gray-400 mt-4 uppercase tracking-widest">
                  Secure Encrypted Transaction
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
