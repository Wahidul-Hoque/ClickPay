'use client';

import { QrCode, Download, Share2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function QRCodePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QR Code</h1>
        <p className="text-gray-600 mt-1">Share your QR code to receive payments</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* QR Code Display */}
        <div className="card text-center">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Payment QR Code</h2>
            <p className="text-sm text-gray-600 mt-1">
              Scan this code to send money to {user?.name}
            </p>
          </div>

          {/* QR Code Placeholder */}
          <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <QrCode className="w-24 h-24 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">QR Code will appear here</p>
              <p className="text-xs text-gray-400 mt-1">
                Phone: {user?.phone}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 justify-center">
            <button className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-4">How to use</h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                1
              </span>
              <span>Show this QR code to the person who wants to pay you</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                2
              </span>
              <span>They scan it with their ClickPay app</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                3
              </span>
              <span>Money will be instantly transferred to your wallet</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}