'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowLeft } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nid: '',
    epin: '',
    confirmEpin: '',
    role: 'user',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.epin !== formData.confirmEpin) {
      toast.error('ePins do not match');
      return;
    }

    if (formData.epin.length !== 5) {
      toast.error('ePin must be exactly 5 digits');
      return;
    }

    setLoading(true);

    try {
      const { confirmEpin, ...registerData } = formData;
      const response = await authAPI.register(registerData);
      
      const { user, token } = response.data.data;
      setAuth(user, token);
      
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <div className="card">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Wallet className="w-12 h-12 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600 mt-2">Join ClickPay and start your digital wallet journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                placeholder="01712345678"
                pattern="^(\+?88)?01[3-9]\d{8}$"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: 01XXXXXXXXX</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NID Number
              </label>
              <input
                type="text"
                name="nid"
                value={formData.nid}
                onChange={handleChange}
                className="input"
                placeholder="Enter your NID number"
                minLength={10}
                maxLength={17}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="user">User</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                User: Personal account | Agent: Cash-in/out services | Admin: System management
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                5-Digit ePin
              </label>
              <input
                type="password"
                name="epin"
                value={formData.epin}
                onChange={handleChange}
                className="input"
                placeholder="Enter 5-digit ePin"
                pattern="\d{5}"
                maxLength={5}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm ePin
              </label>
              <input
                type="password"
                name="confirmEpin"
                value={formData.confirmEpin}
                onChange={handleChange}
                className="input"
                placeholder="Re-enter your ePin"
                pattern="\d{5}"
                maxLength={5}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
