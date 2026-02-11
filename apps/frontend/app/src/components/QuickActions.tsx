'use client'

import { useRouter } from 'next/navigation'
import { 
  Send, 
  QrCode, 
  Receipt, 
  CreditCard, 
  PiggyBank, 
  Repeat,
  ShoppingBag,
  Coins,
  LucideIcon
} from 'lucide-react'

interface QuickAction {
  icon: LucideIcon
  label: string
  href: string
  color: string
}

export default function QuickActions() {
  const router = useRouter()

  const actions: QuickAction[] = [
    { icon: Send, label: 'Send Money', href: '/dashboard/send', color: 'bg-blue-500' },
    { icon: QrCode, label: 'QR Pay', href: '/dashboard/qr', color: 'bg-purple-500' },
    { icon: Receipt, label: 'Pay Bills', href: '/dashboard/bills', color: 'bg-green-500' },
    { icon: CreditCard, label: 'Top Up', href: '/dashboard/topup', color: 'bg-orange-500' },
    { icon: PiggyBank, label: 'Savings', href: '/dashboard/savings', color: 'bg-pink-500' },
    { icon: Coins, label: 'Loans', href: '/dashboard/loans', color: 'bg-yellow-500' },
    { icon: Repeat, label: 'Subscriptions', href: '/dashboard/subscriptions', color: 'bg-indigo-500' },
    { icon: ShoppingBag, label: 'Merchant', href: '/dashboard/merchant', color: 'bg-red-500' },
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-4 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
