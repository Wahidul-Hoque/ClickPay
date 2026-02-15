// ==============================================
// MAIN SERVER FILE
// ==============================================
// This is the entry point of the backend application
// It sets up Express server, middleware, routes, and error handling

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route files
import authRoutes from './routes/auth.js';
import sendRoute from './routes/send.js';
import transactionRoutes from './routes/transactions.js';
import walletRoutes from './routes/wallet.js';
import qrRoutes from './routes/qr.js';
import billRoutes from './routes/bills.js';
import loanRoutes from './routes/loans.js';
import savingsRoutes from './routes/savings.js';

// ==============================================
// LOAD ENVIRONMENT VARIABLES
// ==============================================
// This reads the .env file and makes variables available via process.env
dotenv.config();

// ==============================================
// CREATE EXPRESS APPLICATION
// ==============================================
const app = express();

// ==============================================
// MIDDLEWARE SETUP
// ==============================================
// Middleware functions run before your route handlers
// They process requests in the order they're defined

// 1. CORS - Allow frontend to make requests from different domain
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// 2. JSON Parser - Parse JSON request bodies
// Without this, req.body will be undefined
app.use(express.json());

// 3. URL-encoded Parser - Parse form data
app.use(express.urlencoded({ extended: true }));

// 4. Request Logger (Simple version)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// ==============================================
// HEALTH CHECK ROUTE
// ==============================================
// Simple route to check if server is running
// Visit: http://localhost:5000/health
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ClickPay API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==============================================
// API ROUTES
// ==============================================
// All routes are prefixed with /api/v1
// This allows for API versioning (v1, v2, etc.)

const API_PREFIX = '/api/v1';

// Authentication routes
// POST /api/v1/auth/register
// POST /api/v1/auth/login
// GET  /api/v1/auth/profile
// POST /api/v1/auth/logout
app.use(`${API_PREFIX}/auth`, authRoutes);

// Send money route (single endpoint)
// POST /api/v1/send
app.use(`${API_PREFIX}/send`, sendRoute);

// Transaction routes (history, details, request, cash-in, cash-out)
// GET  /api/v1/transactions/history
// GET  /api/v1/transactions/:transaction_id
// POST /api/v1/transactions/request
// POST /api/v1/transactions/cash-in
// POST /api/v1/transactions/cash-out
app.use(`${API_PREFIX}/transactions`, transactionRoutes);

// Wallet routes
// GET  /api/v1/wallet/balance
// POST /api/v1/wallet/topup
// GET  /api/v1/wallet/payment-methods
// POST /api/v1/wallet/payment-methods
app.use(`${API_PREFIX}/wallet`, walletRoutes);

// QR Code routes
// POST /api/v1/qr/generate
// POST /api/v1/qr/scan
// POST /api/v1/qr/pay
app.use(`${API_PREFIX}/qr`, qrRoutes);

// Bill Payment routes
// GET  /api/v1/bills/billers
// GET  /api/v1/bills/billers/category/:category
// POST /api/v1/bills/pay
// GET  /api/v1/bills/history
app.use(`${API_PREFIX}/bills`, billRoutes);

// Loan routes
// GET  /api/v1/loans/eligibility
// POST /api/v1/loans/apply
// GET  /api/v1/loans/my-loans
// GET  /api/v1/loans/:loan_id
// POST /api/v1/loans/repay/:loan_id
app.use(`${API_PREFIX}/loans`, loanRoutes);

// Savings routes
// GET  /api/v1/savings/interest-rates
// POST /api/v1/savings/create
// GET  /api/v1/savings/my-savings
// GET  /api/v1/savings/:savings_id
// POST /api/v1/savings/break/:savings_id
app.use(`${API_PREFIX}/savings`, savingsRoutes);

// ==============================================
// 404 HANDLER - Route Not Found
// ==============================================
// This runs if no routes match the request
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.url} not found` 
  });
});

// ==============================================
// GLOBAL ERROR HANDLER
// ==============================================
// This catches any errors that occur in routes
// It must have 4 parameters (err, req, res, next)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Send error response
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==============================================
// START SERVER
// ==============================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║       🚀 ClickPay API Server Started           ║
║                                                ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(31)} ║
║   Port:        ${PORT.toString().padEnd(31)} ║
║   API Version: v1                              ║
║                                                ║
║   🔗 Server:  http://localhost:${PORT}              ║
║   📊 Health:  http://localhost:${PORT}/health       ║
║   📚 API:     http://localhost:${PORT}/api/v1       ║
║                                                ║
║   Routes: Auth, Send, Transactions, Wallet,    ║
║           QR, Bills, Loans, Savings            ║
║                                                ║
║   Team: Wahidul Haque (2305054)                ║
║         Abu Bakar Siddique (2305059)           ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});

// ==============================================
// GRACEFUL SHUTDOWN
// ==============================================
// Handle Ctrl+C and other termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export app for testing purposes
export default app;