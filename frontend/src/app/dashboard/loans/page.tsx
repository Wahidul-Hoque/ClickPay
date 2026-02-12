'use client';

import { Download, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loans</h1>
        <p className="text-gray-600 mt-1">Apply for loans and manage your repayments</p>
      </div>

      {/* Loan Eligibility Card */}
      <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium opacity-90 mb-2">Your Loan Limit</h2>
            <div className="text-4xl font-bold mb-4">৳ 50,000</div>
            <p className="text-sm opacity-90">Based on your transaction history</p>
          </div>
          <Download className="w-8 h-8 opacity-90" />
        </div>
        <button className="mt-6 w-full bg-white text-primary-600 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          Apply for Loan
        </button>
      </div>

      {/* Loan Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Instant Approval</h3>
          <p className="text-sm text-gray-600">Get approved in minutes</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Low Interest</h3>
          <p className="text-sm text-gray-600">Starting from 8% per annum</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Flexible Repayment</h3>
          <p className="text-sm text-gray-600">Choose your repayment period</p>
        </div>
      </div>

      {/* Active Loans */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Active Loans</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="text-center py-12 text-gray-500">
          <Download className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No active loans</p>
          <p className="text-sm mt-2">Apply for a loan to get started</p>
        </div>
      </div>

      {/* Loan Calculator */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Loan Calculator</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Amount
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repayment Period (months)
            </label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>3 months</option>
              <option>6 months</option>
              <option>12 months</option>
              <option>24 months</option>
            </select>
          </div>
          <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors">
            Calculate EMI
          </button>
        </div>
      </div>
    </div>
  );
}