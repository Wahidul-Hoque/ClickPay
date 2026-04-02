'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/toastcontext';
import {
  Settings, User, Lock, Shield, Bell, Moon, Sun, ChevronRight,
  X, Eye, EyeOff, Smartphone, HelpCircle, FileText, LogOut, CheckCircle, ArrowLeft, CreditCard, TrendingUp, MapPin
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authAPI, paymentMethodAPI, transactionAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SharedSettings() {
  const { user, logout, updateUser } = useAuthStore();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        if (response.data.success) {
          updateUser(response.data.data);
        }
      } catch (error) {
        console.error('Failed to sync profile:', error);
      }
    };
    fetchProfile();
  }, [updateUser]);

  // PIN change state
  const [showPinModal, setShowPinModal] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [cityInput, setCityInput] = useState(user?.city || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [connectedMethods, setConnectedMethods] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalTopups: 0, totalTopupAmount: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [methodsRes, transRes] = await Promise.all([
          paymentMethodAPI.getMyMethods(),
          transactionAPI.getHistory({ page: 1, limit: 100 })
        ]);
        
        if (methodsRes.data.success) {
          setConnectedMethods(methodsRes.data.data);
        }
        
        if (transRes.data.success) {
          const topups = transRes.data.transactions.filter((t: any) => 
            t.transaction_type === 'bank_transfer' || t.transaction_type === 'cash_in'
          );
          const totalAmount = topups.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
          setStats({ totalTopups: topups.length, totalTopupAmount: totalAmount });
        }
      } catch (error) {
        console.error('Error fetching settings stats:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setCityInput(user.city || '');
    }
  }, [user]);

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

  const handleUpdateName = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      toast.error('Please enter your name.');
      return;
    }
    if (user?.name === trimmedName) {
      toast.info('That name is already on file.');
      return;
    }
    setProfileLoading(true);
    try {
      const response = await authAPI.updateProfile({ name: trimmedName });
      if (response.data.success) {
        const updated = response.data.data;
        updateUser({ name: updated.name, city: updated.city });
        setNameInput(updated.name || '');
        toast.success(response.data.message || 'Name updated successfully');
        setShowNameModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update name');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateCity = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedCity = cityInput.trim();
    if (!trimmedCity) {
      toast.error('Please enter your city.');
      return;
    }
    if (user?.city === trimmedCity) {
      toast.info('That city is already selected.');
      return;
    }
    setProfileLoading(true);
    try {
      const response = await authAPI.updateProfile({ city: trimmedCity });
      if (response.data.success) {
        const updated = response.data.data;
        updateUser({ name: updated.name, city: updated.city });
        setCityInput(updated.city || '');
        toast.success(response.data.message || 'City updated successfully');
        setShowCityModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update city');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleReturnToDashboard = () => {
    const dashboardPath = user?.role === 'user' ? '/dashboard' : `/${user?.role || 'dashboard'}`;
    router.push(dashboardPath);
  };

  const roleColor: Record<string, string> = {
    user: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    agent: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    merchant: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    admin: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header with Return to Dashboard Button */}
      <div className="flex items-center justify-between">
        
        <div>

          <button
            onClick={handleReturnToDashboard}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Return to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-indigo-500/30 hover:shadow-xl transition-all">
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
            <p className="font-black text-sm truncate">{user?.nid || '—'}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">City</p>
            <p className="font-black text-sm truncate">{user?.city || '—'}</p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="font-black text-slate-800 uppercase text-xs tracking-widest">Profile</h2>
        </div>
        <div className="space-y-0">
          <button
            onClick={() => {
              setNameInput(user?.name || '');
              setShowNameModal(true);
            }}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <User className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="text-left">
                <p className="font-black text-slate-800 text-sm">Change Name</p>
                <p className="text-xs text-slate-400 font-medium">Current: {user?.name || '—'}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
          </button>
          <button
            onClick={() => {
              setCityInput(user?.city || '');
              setShowCityModal(true);
            }}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <MapPin className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="text-left">
                <p className="font-black text-slate-800 text-sm">Change City</p>
                <p className="text-xs text-slate-400 font-medium">Current: {user?.city || '—'}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
          </button>
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

      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 relative animate-fadeIn">
            <button
              onClick={() => {
                setShowNameModal(false);
                setNameInput(user?.name || '');
              }}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <User className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">Update Name</h2>
            <p className="text-sm text-slate-500 mb-8">Type your preferred display name for ClickPay.</p>

            <form onSubmit={handleUpdateName} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 font-semibold transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowNameModal(false);
                    setNameInput(user?.name || '');
                  }}
                  className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {profileLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {profileLoading ? 'Saving...' : 'Update Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 relative animate-fadeIn">
            <button
              onClick={() => {
                setShowCityModal(false);
                setCityInput(user?.city || '');
              }}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">Update City</h2>
            <p className="text-sm text-slate-500 mb-8">Change the city tied to your agent profile.</p>

            <form onSubmit={handleUpdateCity} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">City</label>
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Enter your city"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 font-semibold transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowCityModal(false);
                    setCityInput(user?.city || '');
                  }}
                  className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {profileLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {profileLoading ? 'Saving...' : 'Update City'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
