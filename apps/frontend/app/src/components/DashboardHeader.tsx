'use client'

import { useRouter } from 'next/navigation'
import { logout, getUserSession } from '@/lib/auth'
import { Bell, LogOut, User } from 'lucide-react'

export default function DashboardHeader() {
  const router = useRouter()
  const user = getUserSession()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">ClickPay</h1>
            {user && (
              <span className="ml-4 px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full uppercase">
                {user.role}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/notifications')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <User className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
