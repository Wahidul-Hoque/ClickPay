# ClickPay - Complete Setup Guide

## 🎯 Project Overview

**ClickPay** is a comprehensive, feature-rich digital wallet system (similar to bKash/Nagad), developed as a DBMS sessional project. It supports multiple user roles (Personal, Agent, Merchant, Admin) and complex financial logic including interest calculation, automated subscriptions, loans and savings calculation and fraud detection.

**Team:**
- Wahidul Haque (2305054)
- Abu Bakar Siddique (2305059)

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Node.js 22 + Express (MVC Architecture)
- **Database:** PostgreSQL (Supabase) with PL/pgSQL Functions & Triggers

---

## 📂 Project Structure

```
ClickPay/
├── frontend/                 # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/             # App Router (Dashboard, Agent, Merchant panels)
│   │   ├── components/      # Responsive UI Components
│   │   └── lib/             # API Client (Axios) & State (Zustand)
│   └── package.json
│
└── backend/                 # Node.js Express API
    ├── src/
    │   ├── config/          # Database & Env configuration
    │   ├── controllers/     # Route handlers
    │   ├── services/        # Business logic & SQL transactions
    │   ├── routes/          # API endpoint definitions (15+ modules)
    │   ├── middleware/      # Auth (JWT) & Error handling
    │   ├── schedulers/      # Cron jobs (Loans, Savings, Subscriptions)
    │   ├── db/              # SQL Utilities
    │   └── app.js           # Main Entry Point
    ├── package.json
    └── .env.example
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Mandatory .env variables:
# DATABASE_URL=postgresql://postgres:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
# JWT_SECRET=your-secure-secret
# CORS_ORIGIN=http://localhost:3000
# PORT=5000

# Start development server (with nodemon)
npm run dev

# Server will run on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Update .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Start development server
npm run dev

# Application will run on http://localhost:3000
```

---

## ✅ Implemented Features

### 💎 Core Financial Services
- **Send Money:** P2P transfers with limit checks and session-based fraud detection.
- **Cash-In/Out:** Agent-assisted deposits and withdrawals with commission splitting.
- **Request Money:** Request funds from peers with approval workflow.
- **Mobile Recharge:** Utility service simulator with daily/monthly limits.
- **Bill Payments:** Integrated utility billing system for electricity, water, etc.

### 🏦 Advanced Banking Features
- **Fixed Savings:** Create interest-bearing savings with automated maturation.
- **Loan System:** Automated loan application, disbursement, and due-date tracking.
- **Mock Banking:** Link simulated bank accounts and cards for "Add Money" features.
- **Subscriptions:** Merchant subscription plans with automated nightly processing.

### 🛡️ Security & Administration
- **Fraud Detection:** Automated flagging of repeated suspicious transactions.
- **KYC/Compliance:** Audit trail for every transaction event.
- **Admin Dashboard:** System-wide statistics, fraud review, and user management.
- **Role-Based Access:** Distinct panels for Users, Agents, Merchants, and Admins.
- **ePin Security:** 5-digit hashed security pins for all sensitive operations.

---

## 🗄️ Database Schema

The system uses **25+ PostgreSQL tables** to ensure data integrity and auditability:

1.  **users / wallets**: Identity and balance management.
2.  **transactions / transaction_events**: Immutable ledger and detailed audit tail.
3.  **merchant_profiles**: Business-specific metadata and expiry tracking.
4.  **fixed_savings_accounts**: Savings logic and interest rates.
5.  **loan_applications / loans**: Credit management.
6.  **subscriptions**: Recurring payment logic.
7.  **mock_bank_accounts / mock_card_accounts**: Simulated external financial entities.
8.  **user_payment_methods**: User-linked bank/card relationships.
9.  **system_settings**: Dynamic limits and fee configuration.
10. **fraud_alerts**: Non-blocking transaction monitoring results.
11. **favorites**: Saved numbers and agents for faster transactions.

---

## 🔑 Key Implementation Patterns

### 1. Robust Transactions (Backend)
All financial operations use strict PostgreSQL transactions to prevent partial updates.

```javascript
import { getClient } from '../config/database.js';

async function processTransfer(senderId, amount) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // 1. Lock rows (FOR UPDATE)
    // 2. Validate balance & limits
    // 3. Update sender & receiver balances
    // 4. Log immutable transaction record
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### 2. Automated Schedulers
Located in `backend/src/schedulers/`, these run every night to:
- Deduct subscription fees.
- Check for matured savings and add interest.
- Flag overdue loans.

### 3. Frontend Global State
Utilizes **Zustand** for lightweight, persistent session management across panels.

---

## 📱 API Documentation summary

- `POST /api/v1/auth/register` - New user onboarding.
- `POST /api/v1/transactions/send` - Standard transfer.
- `POST /api/v1/loans/apply` - Submit loan request.
- `GET /api/v1/wallets/balance` - Live balance retrieval.
- `GET /api/v1/admin/stats` - System-wide analytics (Admin only).

---

## 🧪 Testing

1. **Auth:** Register as a `user`, `agent`, or `merchant`.
2. **Setup:** Use an `agent` account to `Cash-In` to a `user`.
3. **Transactions:** Try sending money from `user` to another `user`.
4. **Fraud:** Attempt the same amount to the same person 3 times within 1 minute to trigger a **Fraud Alert**.

---

## 👥 Help & Support

For database schema questions or API integration issues, contact:
- **Wahidul Haque** (2305054)
- **Abu Bakar Siddique** (2305059)

---
**🎉 ClickPay Dashboard is now fully operational! Start both servers and navigate to localhost:3000 for the full experience.**
