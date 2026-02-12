# ClickPay Backend API

Node.js backend for ClickPay digital wallet system using Express and PostgreSQL (Supabase).

## Features Implemented
✅ User Registration (with wallet creation)
✅ User Login (JWT authentication)
✅ User Profile
✅ Role-based access control (user, agent, admin)

## Features Pending (Placeholder routes created)
- 📋 Transactions (send, request, cash-in, cash-out)
- 💰 Wallet Management
- 📱 QR Code Payments
- 💵 Bill Payments
- 💳 Loan Management
- 🏦 Fixed Savings Accounts
- 🔄 Subscriptions

## Tech Stack
- **Runtime**: Node.js 22+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT + bcryptjs
- **Validation**: express-validator

## Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── controllers/
│   │   └── authController.js    # Auth endpoints logic
│   ├── services/
│   │   └── authService.js       # Business logic with raw SQL
│   ├── models/                  # Future: Domain models
│   ├── middlewares/
│   │   ├── auth.js              # JWT verification & authorization
│   │   ├── errorHandler.js      # Global error handling
│   │   └── validate.js          # Validation results checker
│   ├── routes/
│   │   ├── index.js             # Route aggregator
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── transactionRoutes.js # Transaction endpoints (placeholder)
│   │   ├── walletRoutes.js      # Wallet endpoints (placeholder)
│   │   ├── qrRoutes.js          # QR code endpoints (placeholder)
│   │   ├── billRoutes.js        # Bill payment endpoints (placeholder)
│   │   ├── loanRoutes.js        # Loan endpoints (placeholder)
│   │   ├── savingsRoutes.js     # Savings endpoints (placeholder)
│   │   └── subscriptionRoutes.js# Subscription endpoints (placeholder)
│   ├── validators/
│   │   └── authValidator.js     # Input validation rules
│   ├── utils/
│   │   ├── auth.js              # JWT & password utilities
│   │   └── response.js          # Standardized API responses
│   └── server.js                # Express app entry point
├── package.json
├── .env.example
└── .gitignore
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
```env
DATABASE_URL=your-supabase-connection-string
JWT_SECRET=your-secret-key
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get current user profile (protected)
- `POST /api/v1/auth/logout` - Logout user (protected)

### Transactions (Placeholder)
- `POST /api/v1/transactions/send` - Send money
- `POST /api/v1/transactions/request` - Request money
- `POST /api/v1/transactions/cash-in` - Cash in (agent only)
- `POST /api/v1/transactions/cash-out` - Cash out
- `GET /api/v1/transactions/history` - Transaction history
- `GET /api/v1/transactions/:id` - Transaction details

### Wallet (Placeholder)
- `GET /api/v1/wallet/balance` - Get balance
- `GET /api/v1/wallet/transactions` - Get wallet transactions
- `POST /api/v1/wallet/payment-methods` - Add payment method
- `GET /api/v1/wallet/payment-methods` - List payment methods
- `POST /api/v1/wallet/topup` - External top-up

### QR Code (Placeholder)
- `POST /api/v1/qr/generate` - Generate QR code
- `GET /api/v1/qr/my-codes` - Get user's QR codes
- `POST /api/v1/qr/pay` - Pay via QR code
- `GET /api/v1/qr/:id` - QR code details
- `PATCH /api/v1/qr/:id/revoke` - Revoke QR code

### Bills (Placeholder)
- `GET /api/v1/bills/billers` - Get all billers
- `GET /api/v1/bills/billers/category/:category` - Get billers by category
- `POST /api/v1/bills/pay` - Pay bill
- `GET /api/v1/bills/history` - Bill payment history

### Loans (Placeholder)
- `POST /api/v1/loans/apply` - Apply for loan
- `GET /api/v1/loans/applications` - Get loan applications
- `GET /api/v1/loans/active` - Get active loans
- `POST /api/v1/loans/:id/repay` - Repay loan
- `GET /api/v1/loans/:id` - Loan details

### Savings (Placeholder)
- `POST /api/v1/savings/create` - Create fixed savings
- `GET /api/v1/savings/accounts` - Get savings accounts
- `GET /api/v1/savings/accounts/:id` - Savings details
- `POST /api/v1/savings/accounts/:id/break` - Break savings
- `GET /api/v1/savings/accounts/:id/interest` - Calculate interest

### Subscriptions (Placeholder)
- `POST /api/v1/subscriptions/create` - Create subscription
- `GET /api/v1/subscriptions/my-subscriptions` - Get subscriptions
- `GET /api/v1/subscriptions/:id` - Subscription details
- `PATCH /api/v1/subscriptions/:id/pause` - Pause subscription
- `PATCH /api/v1/subscriptions/:id/resume` - Resume subscription
- `DELETE /api/v1/subscriptions/:id` - Cancel subscription

## Request/Response Format

### Register Request
```json
{
  "name": "John Doe",
  "phone": "01712345678",
  "nid": "1234567890123",
  "epin": "12345",
  "role": "user"
}
```

### Login Request
```json
{
  "phone": "01712345678",
  "epin": "12345"
}
```

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ /* validation errors if any */ ]
}
```

## Authentication
Protected routes require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Database
All database operations use raw SQL queries via PostgreSQL connection pool. No ORM is used.

## Error Handling
- PostgreSQL constraint errors are automatically handled
- Validation errors return 400 status
- Authentication errors return 401 status
- Authorization errors return 403 status
- Not found errors return 404 status

## Next Steps
Implement the following services with raw SQL:
1. Transaction Service
2. Wallet Service
3. QR Code Service
4. Bill Payment Service
5. Loan Service
6. Savings Service
7. Subscription Service

Each service should follow the pattern established in `authService.js` using raw SQL queries.
