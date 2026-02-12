'use client';

import Link from 'next/link';
import { Wallet, Send, QrCode, CreditCard, TrendingUp, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Wallet className="w-8 h-8 text-primary-600" />
              <span className="text-2xl font-bold text-primary-600">ClickPay</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/auth/login"
                className="px-6 py-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="btn btn-primary"
              >
                Register
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Digital Wallet,
            <span className="text-primary-600"> Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Send money, pay bills, request funds, and manage your finances with ease.
            Join thousands of users who trust ClickPay for their daily transactions.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/register" className="btn btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
            <Link href="#features" className="btn btn-outline text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose ClickPay?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Send className="w-12 h-12 text-primary-600" />}
            title="Instant Transfers"
            description="Send and receive money instantly to anyone with a ClickPay account"
          />
          <FeatureCard
            icon={<QrCode className="w-12 h-12 text-primary-600" />}
            title="QR Payments"
            description="Pay merchants and friends by simply scanning a QR code"
          />
          <FeatureCard
            icon={<CreditCard className="w-12 h-12 text-primary-600" />}
            title="Bill Payments"
            description="Pay your utility bills, mobile recharge, and more in seconds"
          />
          <FeatureCard
            icon={<TrendingUp className="w-12 h-12 text-primary-600" />}
            title="Savings & Loans"
            description="Grow your money with fixed savings or apply for instant loans"
          />
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-primary-600" />}
            title="Secure & Safe"
            description="Bank-level security with 5-digit ePin protection"
          />
          <FeatureCard
            icon={<Wallet className="w-12 h-12 text-primary-600" />}
            title="Multi-Role Support"
            description="User, Agent, and Merchant accounts all in one platform"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8">Join ClickPay today and experience hassle-free digital payments</p>
          <Link href="/auth/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all inline-block">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 ClickPay. A DBMS Project by Wahidul Haque & Abu Bakar Siddique
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
