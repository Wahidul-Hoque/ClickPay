'use client';

import { Settings, User, Lock, Bell, Shield, CreditCard, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function SettingsPage() {
  const { user } = useAuthStore();

  const settingsSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        { label: 'Personal Information', value: 'Update your details' },
        { label: 'Phone Number', value: user?.phone || 'Not set' },
        { label: 'Email Address', value: 'Not set' },
      ],
    },
    {
      title: 'Security',
      icon: Lock,
      items: [
        { label: 'Change PIN', value: 'Update your security PIN' },
        { label: 'Change Password', value: 'Update your password' },
        { label: 'Two-Factor Authentication', value: 'Not enabled' },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Push Notifications', value: 'Enabled' },
        { label: 'SMS Notifications', value: 'Enabled' },
        { label: 'Email Notifications', value: 'Disabled' },
      ],
    },
    {
      title: 'Payment Methods',
      icon: CreditCard,
      items: [
        { label: 'Linked Bank Accounts', value: '0 accounts' },
        { label: 'Cards', value: '0 cards' },
      ],
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
    </div>
  );
}