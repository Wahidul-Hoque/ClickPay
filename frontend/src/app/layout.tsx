import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/contexts/toastcontext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClickPay - Digital Wallet',
  description: 'Send money, pay bills, and manage your wallet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}