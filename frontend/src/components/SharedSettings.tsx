'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/toastcontext';
import {
  Settings, User, Lock, Shield, Bell, Moon, Sun, ChevronRight,
  X, Eye, EyeOff, Smartphone, HelpCircle, FileText, LogOut, CheckCircle
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SharedSettings() {
  const { user, logout } = useAuthStore();
  const toast = useToast();
  const router = useRouter();

  // PIN change state
  const [showPinModal, setShowPinModal] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // Preferences
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPin.length !== 5 || newPin.length !== 5) {
      toast.error('PINs must be exactly 5 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('New PINs do not match.');
      return;
    }
    setPinLoading(true);
    try {
      const response = await authAPI.changePin({ oldPin, newPin });
      if (response.data.success) {
        toast.success('PIN changed successfully!');
        setShowPinModal(false);
        setOldPin(''); setNewPin(''); setConfirmPin('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const roleColor: Record<string, string> = {
    user: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    agent: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    merchant: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    admin: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Settings</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl font-black border border-white/20">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <p className="text-xl font-black tracking-tight">{user?.name || 'User'}</p>
            <p className="text-indigo-200 text-sm">{user?.phone || '—'}</p>
            <span className={`mt-2 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border bg-white/10 text-white border-white/20`}>
              {user?.role || 'user'}
            </span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">NID</p>
            <p className="font-black text-sm truncate">{(user as any)?.nid || '—'}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">City</p>
            <p className="font-black text-sm truncate">{(user as any)?.city || '—'}</p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="font-black text-slate-800 uppercase text-xs tracking-widest">Security</h2>
        </div>
        <button
          onClick={() => setShowPinModal(true)}
          className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              <Shield className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="text-left">
              <p className="font-black text-slate-800 text-sm">Change PIN</p>
              <p className="text-xs text-slate-400 font-medium">Update your 5-digit security PIN</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
        </button>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="font-black text-slate-800 uppercase text-xs tracking-widest">Preferences</h2>
        </div>

        {[
          { label: 'Push Notifications', desc: 'Receive app notifications', state: notifications, setter: setNotifications },
          { label: 'Transaction Alerts', desc: 'Get notified on every transaction', state: transactionAlerts, setter: setTransactionAlerts },
        ].map((pref) => (
          <div key={pref.label} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 last:border-0">
            <div>
              <p className="font-black text-slate-800 text-sm">{pref.label}</p>
              <p className="text-xs text-slate-400 font-medium">{pref.desc}</p>
            </div>
            <button
              onClick={() => pref.setter(!pref.state)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${pref.state ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${pref.state ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Support */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-black text-slate-800 uppercase text-xs tracking-widest">Support</h2>
        </div>
        {[
          { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs and contact options' },
          { icon: FileText, label: 'Terms of Service', desc: 'Read our T&C' },
          { icon: Shield, label: 'Privacy Policy', desc: 'How we handle your data' },
        ].map((item) => (
          <button key={item.label} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                <item.icon className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div className="text-left">
                <p className="font-black text-slate-800 text-sm">{item.label}</p>
                <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-sm rounded-2xl border border-rose-100 transition-all"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>

      <p className="text-center text-xs text-slate-400 font-medium">ClickPay v1.0.0 — Build 2026</p>

      {/* PIN Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 relative animate-fadeIn">
            <button
              onClick={() => { setShowPinModal(false); setOldPin(''); setNewPin(''); setConfirmPin(''); }}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">Change PIN</h2>
            <p className="text-sm text-slate-500 mb-8">Enter your current PIN and choose a new 5-digit PIN.</p>

            <form onSubmit={handleChangePin} className="space-y-5">
              {[
                { label: 'Current PIN', val: oldPin, setter: setOldPin, show: showOld, setShow: setShowOld },
                { label: 'New PIN', val: newPin, setter: setNewPin, show: showNew, setShow: setShowNew },
                { label: 'Confirm New PIN', val: confirmPin, setter: setConfirmPin, show: showNew, setShow: setShowNew },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.show ? 'text' : 'password'}
                      maxLength={5}
                      value={field.val}
                      onChange={(e) => field.setter(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • •"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 font-black text-lg tracking-widest transition-all"
                      required
                    />
                    <button type="button" onClick={() => field.setShow(!field.show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinLoading}
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {pinLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {pinLoading ? 'Saving...' : 'Update PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
