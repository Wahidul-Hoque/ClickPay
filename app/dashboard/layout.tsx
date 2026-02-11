'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserSession } from '@/lib/auth'
import DashboardHeader from '@/components/DashboardHeader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const user = getUserSession()
    if (!user) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
