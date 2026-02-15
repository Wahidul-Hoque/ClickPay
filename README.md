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
├── frontend/              # Next.js 14 App Router application
│   ├── src/
│   │   ├── app/          # Pages and layouts
│   │   ├── components/   # Reusable UI components
│   │   └── lib/          # API client and state management
│   └── package.json
│
└── backend/              # Node.js Express API (FLAT STRUCTURE)
    ├── config/           # Database connection (db.js)
    ├── routes/           # API routes (4 files total)
    │   ├── auth.js              # Authentication endpoints
    │   ├── transactions.js      # Transaction endpoints
    │   ├── wallet.js            # Wallet management endpoints
    │   └── other.js             # QR, Bills, Loans, Savings
    ├── utils/            # Helper functions (auth.js)
    ├── server.js         # Main application entry point
    ├── package.json
    └── .env.example
```

**Note**: Backend has been consolidated into a flat structure. All route files are merged by feature category (auth, transactions, wallet, other).

## Features
- ✅ User Management (User, Agent, Merchant, Admin roles)
- ✅ JWT Authentication with bcrypt
- ✅ Digital Wallet Creation
- ✅ Send Money (implemented)
- ✅ Transaction History (implemented)
- 📋 Request Money (placeholder)
- 📋 Cash In/Out (placeholder)
- 💰 Wallet Balance (placeholder)
- 📱 QR Code Payments (placeholder)
- 💵 Bill Payments (placeholder)
- 💳 Loans & Savings (placeholder)

## Getting Started

### Prerequisites
- Node.js 22+ 
- PostgreSQL database (Supabase account)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your credentials:
# DATABASE_URL=postgresql://...
# JWT_SECRET=your-secret-key
npm run dev
```

Backend will start at: `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Update .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm run dev
```

Frontend will start at: `http://localhost:3000`

## Database
PostgreSQL database hosted on Supabase with 18 tables:
- Users, Wallets, Transactions
- Transaction Events, Compliance Logs
- Payment Methods, Money Requests
- Loans, Savings Accounts, Billers
- Bill Payments, Subscriptions, etc.

## API Endpoints

### Base URL
`http://localhost:5000/api/v1`

### Implemented
- ✅ `POST /auth/register` - Register new user
- ✅ `POST /auth/login` - Login user
- ✅ `GET /auth/profile` - Get user profile (protected)
- ✅ `POST /transactions/send` - Send money (protected)
- ✅ `GET /transactions/history` - Get transaction history (protected)

### Placeholder (Ready to Implement)
- 📋 `POST /transactions/request` - Request money
- 📋 `POST /transactions/cash-in` - Cash in (agent only)
- 📋 `POST /transactions/cash-out` - Cash out
- 📋 `GET /wallet/balance` - Get wallet balance
- 📋 `POST /wallet/topup` - Top up wallet
- 📋 `POST /qr/generate` - Generate QR code
- 📋 `POST /qr/scan` - Scan QR code
- 📋 `GET /bills/billers` - Get billers
- 📋 `POST /bills/pay` - Pay bill
- 📋 `POST /loans/apply` - Apply for loan
- 📋 `POST /savings/create` - Create savings account

## File Consolidation

**Backend has been simplified** from a complex folder structure to just 4 route files:
- **auth.js** - All authentication logic
- **transactions.js** - Send money, history, request, cash-in/out
- **wallet.js** - Balance, topup, payment methods
- **other.js** - QR, bills, loans, savings (placeholder routes)

This makes the codebase easier to navigate and maintain.

## Testing the API

**Register User:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "01712345678",
    "nid": "1234567890",
    "epin": "12345",
    "role": "user"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "01712345678",
    "epin": "12345"
  }'
```

**Send Money:**
```bash
curl -X POST http://localhost:5000/api/v1/transactions/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "toPhone": "01798765432",
    "amount": 500,
    "epin": "12345"
  }'
```

## Troubleshooting

**Backend won't start:**
- Check if port 5000 is in use: `lsof -i :5000`
- Verify DATABASE_URL in .env
- Check Node.js version: `node --version` (should be 22+)

**Database connection error:**
- Test connection: `psql "your-database-url"`
- Verify Supabase connection string format
- Check if IP is whitelisted in Supabase

**Frontend can't reach backend:**
- Ensure backend is running: `http://localhost:5000/health`
- Check NEXT_PUBLIC_API_URL in `.env.local`
- Look for CORS errors in browser console

## License
MIT License - Educational project for DBMS coursework (CSE 216)

---

**🎉 Ready to start? Run `npm run dev` in both backend and frontend!**