'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Key, Lock, CheckCircle2 } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useToast } from '@/contexts/toastcontext';

type Step = 'REQUEST' | 'VERIFY' | 'RESET' | 'SUCCESS';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>('REQUEST');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [phone, setPhone] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newEpin, setNewEpin] = useState('');
  const [confirmEpin, setConfirmEpin] = useState('');

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ phone });
      setMaskedEmail(res.data.maskedEmail);
      toast.success(res.data.message || 'OTP Sent!');
      if (res.data.previewUrl) {
          toast.info(
          <span>
            Dev Preview URL: <a href={res.data.previewUrl} target="_blank" className="text-white underline font-bold">View OTP Email</a>
          </span>
        , 10000 );
      }
      setStep('VERIFY');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request OTP');
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(err.message || 'Validation error');
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.verifyResetOtp({ phone, otp });
      toast.success('OTP Verified!');
      setStep('RESET');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(err.message || 'Validation error');
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset PIN
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEpin !== confirmEpin) {
      toast.error('PINs do not match');
      return;
    }
    if (newEpin.length !== 5) {
      toast.error('PIN must be exactly 5 digits');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ phone, otp, newEpin });
      toast.success('PIN reset successfully!');
      setStep('SUCCESS');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset PIN');
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(err.message || 'Validation error');
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/auth/login" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        <div className="card text-center mb-8 pb-10">
          <div className="flex justify-center mb-4 pt-6">
            <div className="p-4 bg-primary-50 rounded-full">
              {step === 'SUCCESS' ? (
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              ) : step === 'RESET' ? (
                <Lock className="w-10 h-10 text-primary-600" />
              ) : step === 'VERIFY' ? (
                <Key className="w-10 h-10 text-primary-600" />
              ) : (
                <Mail className="w-10 h-10 text-primary-600" />
              )}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'SUCCESS' ? 'PIN Reset Complete' : 
             step === 'RESET' ? 'Set New PIN' :
             step === 'VERIFY' ? 'Verify OTP' : 
             'Forgot PIN?'}
          </h1>
          
          <p className="text-gray-500 mt-2 mb-8 text-sm px-4">
            {step === 'SUCCESS' ? 'Your new PIN has been saved. You can now login.' : 
             step === 'RESET' ? 'Enter a strong 5-digit PIN that you will remember.' :
             step === 'VERIFY' ? `Enter the 6-digit code sent to ${maskedEmail}` : 
             'Enter your registered phone number to receive a reset code.'}
          </p>

          {/* Form Content Based on Step */}
          <div className="text-left px-6">
            
            {/* STEP 1: REQUEST */}
            {step === 'REQUEST' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="input" placeholder="01712345678" pattern="^(\+?88)?01[3-9]\d{8}$"
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full btn btn-primary py-3 mt-4">
                  {loading ? 'Sending...' : 'Send Recovery Code'}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY */}
            {step === 'VERIFY' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">6-Digit OTP</label>
                  <input
                    type="text" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input text-center text-xl tracking-[0.5em] font-bold" 
                    placeholder="------" maxLength={6}
                  />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className="w-full btn btn-primary py-3 mt-4">
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            )}

            {/* STEP 3: RESET */}
            {step === 'RESET' && (
              <form onSubmit={handleResetPin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New 5-Digit PIN</label>
                  <input
                    type="password" required value={newEpin} onChange={(e) => setNewEpin(e.target.value.replace(/\D/g, ''))}
                    className="input tracking-widest text-center text-lg" 
                    placeholder="•••••" maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New PIN</label>
                  <input
                    type="password" required value={confirmEpin} onChange={(e) => setConfirmEpin(e.target.value.replace(/\D/g, ''))}
                    className="input tracking-widest text-center text-lg" 
                    placeholder="•••••" maxLength={5}
                  />
                </div>
                <button type="submit" disabled={loading || newEpin.length !== 5 || confirmEpin.length !== 5} className="w-full btn btn-primary py-3 mt-4">
                  {loading ? 'Saving...' : 'Save New PIN'}
                </button>
              </form>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 'SUCCESS' && (
              <div className="pt-2">
                <Link href="/auth/login" className="w-full btn btn-primary py-3 inline-flex">
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
