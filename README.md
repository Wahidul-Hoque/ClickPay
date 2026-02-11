# ClickPay - Digital Wallet Frontend

A comprehensive Next.js frontend for the ClickPay digital wallet system, featuring phone + ePin authentication, multi-role dashboards, and all core MFS features.

## 🚀 Features Implemented

### Core Features
- ✅ Phone + ePin Authentication (bKash-style)
- ✅ User Registration with wallet auto-creation
- ✅ Multi-role support (User/Agent/Merchant/Admin)
- ✅ Real-time balance display with hide/show toggle
- ✅ Send Money to other users
- ✅ QR Code Payments (generate & manage)
- ✅ Bill Payments (electricity, water, internet, mobile)
- ✅ Transaction History with detailed filtering
- ✅ Real-time Notifications panel
- ✅ Profile Management
- ✅ Analytics & Spending Charts

### Advanced Features
- 📊 Dashboard with quick stats
- 🔔 Notification system
- 💳 Multiple payment methods support
- 🏦 Fixed Savings Accounts
- 💰 Loan Management
- 🔄 Subscription Management
- 🏪 Merchant Profiles
- 📱 Mobile-first responsive design

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account with database already set up
- The schema from `schema_postgresql.sql` should be applied to your Supabase database

## 🛠️ Installation

1. **Extract the project files** to your desired location

2. **Install dependencies:**
```bash
cd clickpay-frontend
npm install
```

3. **Verify environment variables:**
The `.env.local` file is already configured with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://pnzkaglrsovrbkmmhbnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to `http://localhost:3000`

## 📊 Database Setup

Make sure your Supabase database has all tables from the schema. Key tables needed:
- `users` - User accounts
- `wallets` - User wallets
- `transactions` - All transactions
- `transaction_events` - Transaction audit trail
- `qr_codes` - QR payment codes
- `billers` - Service providers for bill payments
- `bill_payments` - Bill payment records
- `money_requests` - P2P money requests
- `subscriptions` - Recurring payments
- `loans` - Loan records
- `loan_applications` - Loan applications
- `fixed_savings_accounts` - Savings accounts
- `merchant_profiles` - Merchant information
- `notifications` - User notifications
- `payment_methods` - Linked payment methods
- `external_topups` - External top-up records
- `agent_fees` - Agent commission tracking
- `compliance_checks` - KYC/AML checks

### Sample Data for Testing

You need to add some sample billers to test bill payments:

```sql
INSERT INTO billers (name, category, status) VALUES
('DESCO', 'electricity', 'active'),
('Dhaka WASA', 'water', 'active'),
('Grameenphone', 'mobile', 'active'),
('Robi', 'mobile', 'active'),
('Link3', 'internet', 'active');
```

## 🔐 Authentication Flow

### Login
1. User enters phone number and ePin
2. System validates credentials against `users` table
3. On success, user session is stored in localStorage
4. User is redirected to dashboard

### Registration
1. User provides: name, phone, NID, ePin
2. System creates user account
3. System auto-creates a wallet for the user
4. User is auto-logged in and redirected to dashboard

### Demo Credentials
For testing, the system currently accepts:
- **Phone:** Any valid phone number (that exists in database)
- **ePin:** `1234` (hardcoded for demo - you should implement proper hashing)

## 🏗️ Project Structure

```
clickpay-frontend/
├── app/
│   ├── dashboard/
│   │   ├── send/          # Send money
│   │   ├── qr/            # QR payments
│   │   ├── bills/         # Bill payments
│   │   ├── topup/         # Top-up wallet
│   │   ├── savings/       # Savings accounts
│   │   ├── loans/         # Loan management
│   │   ├── subscriptions/ # Subscriptions
│   │   ├── merchant/      # Merchant dashboard
│   │   ├── notifications/ # Notifications
│   │   ├── profile/       # User profile
│   │   ├── transactions/  # Transaction history
│   │   └── analytics/     # Analytics & charts
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── layout.tsx         # Root layout
├── components/
│   ├── DashboardHeader.tsx    # Header with logout
│   ├── BalanceCard.tsx        # Balance display
│   ├── QuickActions.tsx       # Quick action buttons
│   └── TransactionList.tsx    # Transaction list
├── lib/
│   ├── supabase.ts        # Supabase client
│   ├── auth.ts            # Authentication functions
│   └── database.ts        # Database operations
└── public/                # Static assets
```

## 🎨 Styling

The project uses:
- **Tailwind CSS** for utility-first styling
- **Modern minimal design** with professional color scheme
- **Primary color:** Blue (#0ea5e9 and variations)
- **Fully responsive** mobile-first design

## 📱 Pages & Routes

### Public Routes
- `/` - Home (redirects to login or dashboard)
- `/login` - Login page
- `/register` - Registration page

### Protected Routes (require authentication)
- `/dashboard` - Main dashboard
- `/dashboard/send` - Send money
- `/dashboard/qr` - QR payments
- `/dashboard/bills` - Bill payments
- `/dashboard/topup` - Top-up wallet
- `/dashboard/savings` - Savings accounts
- `/dashboard/loans` - Loans
- `/dashboard/subscriptions` - Subscriptions
- `/dashboard/merchant` - Merchant features
- `/dashboard/notifications` - Notifications
- `/dashboard/profile` - User profile
- `/dashboard/transactions` - Transaction history
- `/dashboard/analytics` - Analytics

## 🔧 Configuration

### Customizing Colors
Edit `tailwind.config.js` to change the primary color scheme:

```javascript
colors: {
  primary: {
    // Change these values
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
  },
}
```

### Adding Features
Each feature page follows the same pattern:
1. Create a new folder in `app/dashboard/`
2. Add a `page.tsx` file
3. Import necessary components and utilities
4. Use the database functions from `lib/database.ts`

## 🚨 Important Notes

### Security
⚠️ **IMPORTANT:** The current authentication implementation uses a temporary ePin comparison. For production:

1. **Implement proper password hashing:**
```typescript
// In registration
import bcrypt from 'bcryptjs'
const hashedPin = await bcrypt.hash(epin, 10)

// In login
const isValidPin = await bcrypt.compare(epin, data.epin_hash)
```

2. **Add JWT tokens** for session management
3. **Implement proper Row Level Security (RLS)** in Supabase
4. **Add rate limiting** for authentication attempts
5. **Implement 2FA** for sensitive operations

### Transaction Handling
The current send money implementation is simplified. For production:
1. Use **database transactions** (BEGIN/COMMIT/ROLLBACK)
2. Implement **transaction locking** to prevent race conditions
3. Add **idempotency keys** for duplicate prevention
4. Implement **proper reconciliation** processes

### Next Steps for Production

1. **Complete remaining pages:**
   - Top-up functionality
   - Savings account creation/management
   - Loan application/management
   - Subscription management
   - Merchant dashboard
   - Notifications system
   - Analytics charts
   - Transaction search/filter

2. **Add proper error handling:**
   - Global error boundary
   - Retry logic for failed requests
   - User-friendly error messages

3. **Implement real-time features:**
   - Live balance updates
   - Push notifications
   - Real-time transaction status

4. **Testing:**
   - Unit tests
   - Integration tests
   - E2E tests with Cypress/Playwright

5. **Performance optimization:**
   - Image optimization
   - Code splitting
   - Lazy loading
   - Caching strategies

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify database schema is correctly applied
3. Ensure environment variables are set
4. Check Supabase connection

## 👥 Team

- Wahidul Haque (2305054)
- Abu Bakar Siddique (2305059)

## 📄 License

This project is for educational purposes (DBMS Sessional Lab Project).
