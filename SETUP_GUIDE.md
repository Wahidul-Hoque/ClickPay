# ClickPay - Complete Setup Guide

## 🎯 Project Overview

**ClickPay** is a comprehensive digital wallet system similar to bKash, built as a DBMS sessional project.

**Team:**
- Wahidul Haque (2305054)
- Abu Bakar Siddique (2305059)

**Tech Stack:**
- Frontend: Next.js 14 (App Router) + Tailwind CSS
- Backend: Node.js 22+ + Express
- Database: PostgreSQL (Supabase)

---

## 📁 Project Structure

```
clickpay-project/
├── frontend/                 # Next.js 14 application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── auth/        # Login & Register
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   └── ...          # Other feature pages (placeholders)
│   │   ├── components/      # Reusable components
│   │   ├── lib/             # API client, store, utilities
│   │   └── ...
│   └── package.json
│
└── backend/                  # Node.js Express API
    ├── src/
    │   ├── config/          # Database connection
    │   ├── controllers/     # Route handlers
    │   ├── services/        # Business logic (raw SQL)
    │   ├── middlewares/     # Auth, validation, errors
    │   ├── routes/          # API routes
    │   ├── validators/      # Input validation
    │   ├── utils/           # Helper functions
    │   └── server.js        # Entry point
    └── package.json
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

# Update .env with your Supabase credentials
# DATABASE_URL=postgresql://postgres.pnzkaglrsovrbkmmhbnn:123FW_m6AK91@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
# JWT_SECRET=your-secret-key-here

# Start development server
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

### Backend (Fully Functional)
- ✅ User Registration with automatic wallet creation
- ✅ User Login with JWT authentication
- ✅ User Profile retrieval
- ✅ Role-based access control (user, agent, admin)
- ✅ Input validation with detailed error messages
- ✅ PostgreSQL connection with raw SQL queries
- ✅ Global error handling
- ✅ CORS configuration
- ✅ Security headers (Helmet)

### Frontend (Fully Functional)
- ✅ Beautiful landing page
- ✅ User registration form with role selection
- ✅ User login form
- ✅ Protected dashboard with sidebar navigation
- ✅ Responsive design (mobile-friendly)
- ✅ JWT token management
- ✅ Toast notifications
- ✅ Global state management (Zustand)
- ✅ Auto-redirect for unauthenticated users

---

## 📋 Placeholder Features (Routes Created, Implementation Pending)

### Backend Routes Ready
- Transactions (send, request, cash-in, cash-out, history)
- Wallet Management (balance, payment methods, top-up)
- QR Code (generate, scan, pay)
- Bill Payments (billers, pay, history)
- Loans (apply, repay, history)
- Savings (create, break, interest calculation)
- Subscriptions (create, pause, cancel)

### Frontend Pages Structured
- Transaction Management
- Wallet Management
- QR Code Features
- Bill Payments
- Loan Management
- Fixed Savings
- Subscriptions
- Settings

---

## 🔐 Authentication Flow

### Registration
1. User fills: name, phone (BD format), NID, 5-digit ePin, role
2. Backend validates input
3. ePin is hashed with bcrypt
4. User record created in `users` table
5. Wallet automatically created in `wallets` table
6. JWT token generated and returned
7. Frontend stores token and user data
8. User redirected to dashboard

### Login
1. User enters phone and 5-digit ePin
2. Backend finds user by phone
3. ePin verified using bcrypt
4. JWT token generated
5. User data and token returned
6. Frontend stores and redirects to dashboard

---

## 🗄️ Database Schema (18 Tables)

Your database already has these tables created:

1. **users** - User accounts with ePin
2. **wallets** - Digital wallets (user, agent, system)
3. **payment_methods** - Linked bank/card accounts
4. **transactions** - All financial transactions
5. **transaction_events** - Transaction audit trail
6. **compliance_checks** - KYC/AML verification
7. **agent_fees** - Agent commission tracking
8. **external_topups** - External money additions
9. **billers** - Utility bill providers
10. **bill_payments** - Bill payment records
11. **qr_codes** - QR code payments
12. **money_requests** - P2P fund requests
13. **fixed_savings_accounts** - Savings accounts
14. **loan_applications** - Loan applications
15. **loans** - Active loans
16. **subscriptions** - Recurring payments
17. **merchant_profiles** - Merchant accounts
18. **notifications** - User notifications

---

## 🛠️ How to Implement Remaining Features

### Example: Implementing Send Money

#### 1. Backend Service (`backend/src/services/transactionService.js`)

```javascript
import { query, getClient } from '../config/database.js';

class TransactionService {
  async sendMoney(fromUserId, toPhone, amount, epin) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // 1. Verify sender's ePin
      // 2. Get sender's wallet
      // 3. Check sufficient balance
      // 4. Get receiver's wallet by phone
      // 5. Create transaction record
      // 6. Deduct from sender
      // 7. Add to receiver
      // 8. Create transaction events
      // 9. Create compliance check
      
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

#### 2. Backend Controller (`backend/src/controllers/transactionController.js`)

```javascript
import transactionService from '../services/transactionService.js';

class TransactionController {
  async send(req, res, next) {
    try {
      const { toPhone, amount, epin } = req.body;
      const fromUserId = req.user.userId;
      
      const result = await transactionService.sendMoney(
        fromUserId, toPhone, amount, epin
      );
      
      return successResponse(res, result, 'Money sent successfully');
    } catch (error) {
      next(error);
    }
  }
}
```

#### 3. Update Backend Route (already exists as placeholder)

Just replace the placeholder in `backend/src/routes/transactionRoutes.js` with:
```javascript
router.post('/send', protect, transactionController.send);
```

#### 4. Frontend Page (`frontend/src/app/dashboard/send/page.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { transactionAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SendMoneyPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    toPhone: '',
    amount: '',
    epin: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await transactionAPI.send(formData);
      toast.success('Money sent successfully!');
      // Reset form or redirect
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send money');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Send Money</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        {/* Form fields */}
      </form>
    </div>
  );
}
```

---

## 🔑 Key Implementation Patterns

### 1. Raw SQL Queries (Backend)
All database operations use raw SQL with parameterized queries:

```javascript
const result = await query(
  'SELECT * FROM users WHERE phone = $1',
  [phone]
);
```

### 2. Transaction Management
Use PostgreSQL transactions for multi-step operations:

```javascript
const client = await getClient();
try {
  await client.query('BEGIN');
  // Multiple queries here
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 3. JWT Protection
Protect routes with middleware:

```javascript
router.post('/send', protect, controller.send);
router.get('/admin', protect, authorize('admin'), controller.adminOnly);
```

### 4. Frontend API Calls
Use the configured API client:

```typescript
import { authAPI, transactionAPI } from '@/lib/api';

// Token automatically added
const response = await transactionAPI.send(data);
```

---

## 📱 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get user profile (protected)
- `POST /api/v1/auth/logout` - Logout (protected)

### Health Check
- `GET /health` - Server health status

### Placeholder Routes (Created but not implemented)
- All transaction, wallet, QR, bill, loan, savings, subscription routes

See `backend/README.md` for complete API documentation.

---

## 🎨 UI Components

### Pre-built CSS Classes

**Buttons:**
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
```

**Inputs:**
```html
<input class="input" placeholder="Enter value" />
```

**Cards:**
```html
<div class="card">Content here</div>
```

**Badges:**
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-error">Failed</span>
```

---

## 🧪 Testing the Application

### 1. Test Registration

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "01712345678",
    "nid": "1234567890123",
    "epin": "12345",
    "role": "user"
  }'
```

### 2. Test Login

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "01712345678",
    "epin": "12345"
  }'
```

### 3. Test Protected Route

```bash
curl http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Failed:**
```bash
# Check your .env file
# Ensure DATABASE_URL is correct
# Test connection: psql "your-connection-string"
```

**Port 5000 Already in Use:**
```bash
# Change PORT in .env file
PORT=5001
```

### Frontend Issues

**API Connection Error:**
```bash
# Ensure backend is running
# Check NEXT_PUBLIC_API_URL in .env.local
# Should be http://localhost:5000/api/v1
```

**Authentication Not Working:**
```javascript
// Clear browser storage
localStorage.clear();
// Try logging in again
```

---

## 📊 Project Statistics

- **Total Files Created:** 33+ files
- **Backend Routes:** 8 route files (1 fully implemented)
- **Frontend Pages:** 10+ pages (4 fully implemented)
- **Database Tables:** 18 tables (pre-existing in Supabase)
- **Lines of Code:** ~3000+ lines

---

## 🎯 Next Steps for Development

### Priority 1: Core Transactions
1. Implement send money service
2. Add transaction history display
3. Create request money feature
4. Build cash-in/cash-out for agents

### Priority 2: Additional Features
1. QR code generation and scanning
2. Bill payment integration
3. Savings account creation
4. Loan application system

### Priority 3: Enhancements
1. Transaction receipts (PDF/email)
2. Push notifications
3. Profile management
4. Transaction limits and fees
5. Admin dashboard

---

## 📚 Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Supabase:** https://supabase.com/docs

---

## 👥 Team Contacts

- **Wahidul Haque** (2305054)
- **Abu Bakar Siddique** (2305059)

---

## 📄 License

MIT License - This is an educational project for DBMS coursework.

---

**🎉 Your ClickPay project is ready! Start the backend and frontend servers, then open http://localhost:3000 to begin testing!**
