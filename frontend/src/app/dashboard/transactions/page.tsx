'use client';

import { FileText, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import { useState } from 'react';

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">View and search your transaction history</p>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto">
        {['All', 'Sent', 'Received', 'Bills', 'Recharge'].map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 rounded-lg font-medium whitespace-nowrap border border-gray-300 hover:bg-primary-50 hover:border-primary-500 transition-colors"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No transactions yet</p>
          <p className="text-sm mt-2">Your transaction history will appear here</p>
        </div>

        {/* Example Transaction Items (commented out - uncomment when you have data) */}
        {/* <div className="divide-y">
          <TransactionItem
            type="sent"
            recipient="John Doe"
            amount={500}
            date="2 hours ago"
            status="completed"
          />
          <TransactionItem
            type="received"
            recipient="Jane Smith"
            amount={1200}
            date="5 hours ago"
            status="completed"
          />
        </div> */}
      </div>
    </div>
  );
}

// Helper component for transaction items
function TransactionItem({
  type,
  recipient,
  amount,
  date,
  status,
}: {
  type: 'sent' | 'received';
  recipient: string;
  amount: number;
  date: string;
  status: string;
}) {
  const isSent = type === 'sent';
  
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${isSent ? 'bg-red-100' : 'bg-green-100'}`}>
          {isSent ? (
            <ArrowUpRight className="w-5 h-5 text-red-600" />
          ) : (
            <ArrowDownLeft className="w-5 h-5 text-green-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{recipient}</p>
          <p className="text-sm text-gray-600">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${isSent ? 'text-red-600' : 'text-green-600'}`}>
          {isSent ? '-' : '+'}৳{amount.toLocaleString()}
        </p>
        <span className="text-xs text-gray-500 capitalize">{status}</span>
      </div>
    </div>
  );
}