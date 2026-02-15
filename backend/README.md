# ClickPay Backend API

Node.js Express backend for ClickPay digital wallet system with MVC architecture.

**Team:** Wahidul Haque (2305054) & Abu Bakar Siddique (2305059)

---

## 🏗️ Architecture - The Restaurant Analogy

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Customer)                     │
│                 Frontend sends request                   │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              ROUTES (The Menu) 📋                        │
│         Shows what endpoints are available               │
│         /api/v1/auth/register                           │
│         /api/v1/transactions/send                       │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│          MIDDLEWARE (Security Guard) 🛡️                  │
│       - Check if user has valid token                   │
│       - Verify user's role/permissions                  │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│          CONTROLLERS (The Waiter) 🙋                     │
│       - Takes the order (request)                       │
│       - Validates the order                             │
│       - Passes order to kitchen (service)               │
│       - Brings back the food (response)                 │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│          SERVICES (The Kitchen) 👨‍🍳                       │
│       - Does the actual cooking (business logic)        │
│       - Executes SQL queries                            │
│       - Handles database transactions                   │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│            CONFIG (The Storage) 🗄️                       │
│          - Database connection                          │
│          - Environment variables                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/               # Configuration files
│   │   └── database.js      # PostgreSQL connection (Supabase)
│   │
│   ├── middleware/           # Middleware functions
│   │   ├── auth.js          # JWT verification, password hashing
│   │   └── errorHandler.js  # Global error handling
│   │
│   ├── controllers/          # Request/Response handlers (The Waiter)
│   │   ├── authController.js        # Register, Login, Profile
│   │   └── transactionController.js # Send money, History
│   │
│   ├── services/             # Business logic & SQL queries (The Kitchen)
│   │   ├── authService.js           # All auth SQL queries
│   │   └── transactionService.js    # All transaction SQL queries
│   │
│   ├── routes/               # API endpoint definitions (The Menu)
│   │   ├── authRoutes.js            # /api/v1/auth/*
│   │   ├── transactionRoutes.js     # /api/v1/transactions/*
│   │   └── otherRoutes.js           # Other features (placeholders)
│   │
│   ├── db/                   # SQL files
│   │   ├── schema_postgresql.sql    # Database schema (reference)
│   │   └── README.md                # Database documentation
│   │
│   └── app.js                # Main entry point
│
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore file
├── package.json             # Dependencies
└── README.md                # This file
```

---

## ✅ Features Implemented

### Authentication (/api/v1/auth)
- ✅ **Register** - Create new user with wallet
- ✅ **Login** - JWT authentication
- ✅ **Profile** - Get current user data
- ✅ **Logout** - Logout user

### Transactions (/api/v1/transactions)
- ✅ **Send Money** - Transfer money between users
- ✅ **Transaction History** - Get past transactions with pagination

### Placeholders (Ready to implement)
- 📋 Request Money
- 📋 Cash In (for agents)
- 📋 Cash Out
- 📋 Wallet Management
- 📋 QR Code Payments
- 📋 Bill Payments
- 📋 Loan Management
- 📋 Savings Accounts

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env file with your credentials
# DATABASE_URL=your-supabase-connection-string
# JWT_SECRET=your-secret-key
```

### 3. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on **http://localhost:5000**

---

## 📖 How It Works

### Example: Register New User

#### 1. **Route** (The Menu) - `src/routes/authRoutes.js`
```javascript
router.post('/register', authController.register);
```
Says: "POST request to /api/v1/auth/register goes to authController.register"

#### 2. **Controller** (The Waiter) - `src/controllers/authController.js`
```javascript
async register(req, res, next) {
  // 1. Validate input
  const { name, phone, nid, epin, role } = req.body;
  
  // 2. Call service
  const result = await authService.register(req.body);
  
  // 3. Send response
  res.status(201).json({ success: true, data: result });
}
```
Says: "Take the order, validate it, send to kitchen, bring back result"

#### 3. **Service** (The Kitchen) - `src/services/authService.js`
```javascript
async register(userData) {
  // 1. Hash password
  const epinHash = await hashPassword(epin);
  
  // 2. Insert into database
  const userQuery = `INSERT INTO users (...) VALUES (...)`;
  const user = await client.query(userQuery, [name, phone, nid, epinHash, role, 'active']);
  
  // 3. Create wallet
  const walletQuery = `INSERT INTO wallets (...) VALUES (...)`;
  const wallet = await client.query(walletQuery, [user.user_id, walletType, 0.00, 'active']);
  
  // 4. Generate token
  const token = generateToken(user.user_id, user.role);
  
  return { user, wallet, token };
}
```
Says: "Do all the work - hash password, save to database, create wallet, generate token"

---

## 🔐 API Endpoints

### Authentication

```
POST   /api/v1/auth/register       Register new user
POST   /api/v1/auth/login          Login user
GET    /api/v1/auth/profile        Get user profile (protected)
POST   /api/v1/auth/logout         Logout user (protected)
```

### Transactions

```
POST   /api/v1/transactions/send      Send money (protected)
GET    /api/v1/transactions/history   Get transaction history (protected)
POST   /api/v1/transactions/request   Request money (protected)
POST   /api/v1/transactions/cash-in   Cash in - agents only (protected)
POST   /api/v1/transactions/cash-out  Cash out (protected)
```

### Other Features (Placeholders)

```
GET    /api/v1/wallet/balance           Get balance
POST   /api/v1/wallet/topup             External top-up
GET    /api/v1/qr/my-codes              Get my QR codes
POST   /api/v1/bills/pay                Pay utility bill
POST   /api/v1/loans/apply              Apply for loan
POST   /api/v1/savings/create           Create savings account
```

---

## 🧪 Testing with Postman/Thunder Client

### 1. Register User

```http
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "phone": "01712345678",
  "nid": "1234567890123",
  "epin": "12345",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "phone": "01712345678",
  "epin": "12345"
}
```

**Copy the `token` from response!**

### 3. Send Money

```http
POST http://localhost:5000/api/v1/transactions/send
Authorization: Bearer <paste-your-token-here>
Content-Type: application/json

{
  "toPhone": "01798765432",
  "amount": 100,
  "epin": "12345"
}
```

### 4. Get Transaction History

```http
GET http://localhost:5000/api/v1/transactions/history?page=1&limit=10
Authorization: Bearer <paste-your-token-here>
```

---

## 🎓 Understanding the Code Flow

### Registration Flow

```
1. Frontend sends: { name, phone, nid, epin, role }
                    ↓
2. Route: POST /api/v1/auth/register
                    ↓
3. Controller: authController.register()
   - Validates input
   - Calls authService.register()
                    ↓
4. Service: authService.register()
   - BEGIN transaction
   - Hash ePin
   - INSERT INTO users
   - INSERT INTO wallets
   - COMMIT transaction
   - Generate JWT token
   - Return { user, wallet, token }
                    ↓
5. Controller: Sends response to frontend
   - Status: 201
   - Body: { success, message, data }
```

### Send Money Flow

```
1. Frontend sends: { toPhone, amount, epin } + JWT token
                    ↓
2. Middleware: protect (verifies JWT)
                    ↓
3. Route: POST /api/v1/transactions/send
                    ↓
4. Controller: transactionController.send()
   - Validates input
   - Calls transactionService.sendMoney()
                    ↓
5. Service: transactionService.sendMoney()
   - BEGIN transaction
   - Verify sender's ePin
   - Get sender's wallet
   - Check balance
   - Get receiver's wallet
   - INSERT INTO transactions
   - UPDATE wallets (deduct from sender)
   - UPDATE wallets (add to receiver)
   - INSERT INTO transaction_events
   - COMMIT transaction
   - Return transaction details
                    ↓
6. Controller: Sends response to frontend
   - Status: 200
   - Body: { success, message, data }
```

---

## 💡 How to Add New Features

### Example: Implementing Bill Payment

#### Step 1: Create Service (The Kitchen)
File: `src/services/billService.js`

```javascript
import { query, getClient } from '../config/database.js';

class BillService {
  async payBill(userId, billerId, amount, accountNumber) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // 1. Get biller details
      // 2. Get user's wallet
      // 3. Check balance
      // 4. Create bill_payment record
      // 5. Deduct from wallet
      // 6. Create transaction
      
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

export default new BillService();
```

#### Step 2: Create Controller (The Waiter)
File: `src/controllers/billController.js`

```javascript
import billService from '../services/billService.js';

class BillController {
  async pay(req, res, next) {
    try {
      const { billerId, amount, accountNumber } = req.body;
      const userId = req.user.userId;
      
      const result = await billService.payBill(userId, billerId, amount, accountNumber);
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new BillController();
```

#### Step 3: Create Routes (The Menu)
File: `src/routes/billRoutes.js`

```javascript
import express from 'express';
import billController from '../controllers/billController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/pay', protect, billController.pay);

export default router;
```

#### Step 4: Register Routes in app.js

```javascript
import billRoutes from './routes/billRoutes.js';

app.use(`${API_PREFIX}/bills`, billRoutes);
```

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 22+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Environment**: dotenv
- **CORS**: cors package

---

## 🔒 Security Features

- ✅ **Password Hashing** - ePin stored as bcrypt hash
- ✅ **JWT Authentication** - Stateless token-based auth
- ✅ **SQL Injection Prevention** - Parameterized queries ($1, $2)
- ✅ **Role-based Access Control** - authorize() middleware
- ✅ **CORS Protection** - Configured allowed origins
- ✅ **Input Validation** - Controllers validate all inputs

---

## 📝 Database Transactions

All multi-step operations use database transactions:

```javascript
const client = await getClient();

try {
  await client.query('BEGIN');
  
  // Step 1: Do something
  await client.query('INSERT INTO ...');
  
  // Step 2: Do something else
  await client.query('UPDATE ...');
  
  // If all succeed, save changes
  await client.query('COMMIT');
  
} catch (error) {
  // If any step fails, undo everything
  await client.query('ROLLBACK');
  throw error;
  
} finally {
  // Always release the client
  client.release();
}
```

---

## 🐛 Common Issues

### Port 5000 already in use?
```bash
# Change PORT in .env
PORT=5001
```

### Database connection error?
```bash
# Check your .env DATABASE_URL is correct
# Test in Supabase dashboard
```

### Token expired?
```bash
# Login again to get new token
# Tokens expire after 7 days
```

---

## 📚 For Your DBMS Course

### What to Show in Viva:

1. **Architecture** - Explain MVC pattern (Menu → Waiter → Kitchen)
2. **SQL Queries** - Show raw SQL in services (no ORM)
3. **Transactions** - Demonstrate BEGIN, COMMIT, ROLLBACK
4. **JOINs** - Show transaction history query
5. **Security** - Password hashing, JWT, SQL injection prevention

### Important Files to Know:

- `src/app.js` - Main entry point
- `src/config/database.js` - Database setup
- `src/services/authService.js` - Complete auth implementation
- `src/services/transactionService.js` - Complete transaction implementation
- `src/middleware/auth.js` - JWT verification

---

## 🎯 Next Steps

1. **Test the API** - Use Postman/Thunder Client
2. **Implement new features** - Follow the pattern
3. **Add validations** - Improve input validation
4. **Error handling** - Add more specific error messages
5. **Documentation** - Add API documentation

---

## 👥 Team

- **Wahidul Haque** (2305054)
- **Abu Bakar Siddique** (2305059)

---

Good luck with your DBMS project! 🚀
