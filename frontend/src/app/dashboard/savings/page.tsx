'use client';

import { TrendingUp, PiggyBank, Target, Plus } from 'lucide-react';

export default function SavingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Savings</h1>
        <p className="text-gray-600 mt-1">Save money and earn interest</p>
      </div>

      {/* Total Savings Card */}
      <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium opacity-90">Total Savings</h2>
          <PiggyBank className="w-6 h-6 opacity-90" />
        </div>
        <div className="text-4xl font-bold mb-2">৳ 0.00</div>
        <p className="text-sm opacity-90 mb-6">Interest earned this month: ৳ 0.00</p>
        <button className="w-full bg-white text-green-600 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add to Savings</span>
        </button>
      </div>

      {/* Savings Plans */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Savings Plans</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            + Create New Plan
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Example Savings Plan */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Emergency Fund</h3>
                <p className="text-sm text-gray-600">Save for emergencies</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">৳ 0 / ৳ 50,000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">0% Complete</span>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Add Money
              </button>
            </div>
          </div>

          {/* Placeholder for more plans */}
          <div className="card border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
            <div className="text-center py-8">
              <Plus className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-700">Create New Plan</p>
              <p className="text-sm text-gray-500 mt-1">Set a savings goal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interest Rates */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Interest Rates</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Regular Savings</h3>
              <p className="text-sm text-gray-600">Flexible withdrawals</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">5%</p>
              <p className="text-xs text-gray-500">per annum</p>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Fixed Savings</h3>
              <p className="text-sm text-gray-600">Lock-in for 12 months</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">8%</p>
              <p className="text-xs text-gray-500">per annum</p>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Tips */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Savings Tip</h3>
            <p className="text-sm text-gray-700">
              Set up automatic transfers to your savings account every month. Even small amounts add up over time!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}