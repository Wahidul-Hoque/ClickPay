'use client';

import { CreditCard, Zap, Droplet, Wifi, Phone, Tv } from 'lucide-react';

export default function BillsPage() {
  const billCategories = [
    { name: 'Electricity', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { name: 'Water', icon: Droplet, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { name: 'Internet', icon: Wifi, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { name: 'Mobile', icon: Phone, color: 'text-green-600', bgColor: 'bg-green-100' },
    { name: 'TV/Cable', icon: Tv, color: 'text-red-600', bgColor: 'bg-red-100' },
    { name: 'Gas', icon: CreditCard, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pay Bills</h1>
        <p className="text-gray-600 mt-1">Pay your utility bills instantly</p>
      </div>

      {/* Bill Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {billCategories.map((category) => (
          <button
            key={category.name}
            className="card hover:shadow-lg transition-all text-center group"
          >
            <div className={`w-16 h-16 ${category.bgColor} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
              <category.icon className={`w-8 h-8 ${category.color}`} />
            </div>
            <h3 className="font-medium text-gray-900">{category.name}</h3>
          </button>
        ))}
      </div>

      {/* Recent Bills */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Bills</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="text-center py-12 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No bill payments yet</p>
          <p className="text-sm mt-2">Your bill payment history will appear here</p>
        </div>
      </div>

      {/* Saved Billers */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Saved Billers</h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No saved billers</p>
          <button className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium">
            + Add Biller
          </button>
        </div>
      </div>
    </div>
  );
}