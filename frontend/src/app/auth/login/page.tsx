'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowLeft } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    epin: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      const { user, token } = response.data.data;
      setAuth(user, token);
      
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
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
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Login to access your ClickPay wallet</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Enter your 5-digit ePin"
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
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
