'use client';

import { useState } from 'react';
import { Settings, User, Lock, CreditCard, HelpCircle, Shield, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function SharedSettings() {
  const { user } = useAuthStore();
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPin.length !== 5 || newPin.length !== 5) {
      setMessage('PINs must be exactly 5 digits.');
      return;
    }
    // Simulate API call to change PIN since the backend is not yet implemented
    setMessage('Processing...');
    setTimeout(() => {
      setMessage('PIN changed successfully!');
      setTimeout(() => {
        setIsChangingPin(false);
        setOldPin('');
        setNewPin('');
        setMessage('');
      }, 2000);
    }, 1000);
  };

  type SettingsItem = {
    label: string;
    value: string;
    onClick?: () => void;
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        { label: 'Name', value: user?.name || 'Not set' },
        { label: 'NID', value: user?.nid || 'Not set' },
        { label: 'Phone Number', value: user?.phone || 'Not set' },
        { label: 'City', value: (user as any)?.city || 'Not set' },
      ] as SettingsItem[],
    },
    {
      title: 'Security',
      icon: Lock,
      items: [
        { 
          label: 'Change PIN', 
          value: 'Update your security PIN',
          onClick: () => setIsChangingPin(true)
        },
      ] as SettingsItem[],
    },
    {
      title: 'Payment Methods',
      icon: CreditCard,
      items: [
        { label: 'Linked Bank Accounts', value: '0 accounts' },
        { label: 'Cards', value: '0 cards' },
      ] as SettingsItem[],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* User Profile Card */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h2>
            <p className="text-gray-600">{user?.phone || 'No phone number'}</p>
            {user?.role && (
              <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            )}
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="card">
          <div className="flex items-center space-x-3 mb-4">
            <section.icon className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold">{section.title}</h2>
          </div>
          <div className="space-y-3">
            {section.items.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.value}</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Other Options */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Other</h2>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Help & Support</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Privacy Policy</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Terms of Service</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* App Version */}
      <div className="text-center text-sm text-gray-500 pb-8">
        ClickPay v1.0.0
      </div>

      {/* Change PIN Modal */}
      {isChangingPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => { setIsChangingPin(false); setMessage(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Lock className="w-6 h-6 mr-2 text-primary-600" />
              Change PIN
            </h2>

            <form onSubmit={handleChangePin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Old PIN</label>
                <input
                  type="password"
                  maxLength={5}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 5-digit old PIN"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
                <input
                  type="password"
                  maxLength={5}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 5-digit new PIN"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.includes('success') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : message.includes('Processing')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Confirm Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
