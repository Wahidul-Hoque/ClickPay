# ClickPay - Digital Wallet System

A comprehensive digital wallet platform built with Next.js 14, Node.js, and PostgreSQL (Supabase).

## Team
- Wahidul Haque (2305054)
- Abu Bakar Siddique (2305059)

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)

## Project Structure
```
clickpay-project/
├── frontend/          # Next.js 14 App Router application
└── backend/           # Node.js Express API
```

## Features
- User Management (User, Agent, Merchant, Admin roles)
- Digital Wallet & Transactions
- QR Code Payments
- Bill Payments & Subscriptions
- Loan Applications & Management
- Fixed Savings Accounts
- Money Requests
- Agent Fee Management
- Real-time Compliance Checks

## Getting Started

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your Supabase credentials
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Database
PostgreSQL database hosted on Supabase with 18 tables managing:
- User authentication and profiles
- Wallet management
- Transactions and events
- Compliance checks
- Payment methods
- Loans and savings
- Subscriptions and bill payments
