// ==============================================
// MAIN ENTRY POINT (app.js)
// ==============================================
import './config/env.js';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import subscriptionService from './services/subscriptionService.js';
import './schedulers/subscriptionScheduler.js'; // Import the scheduler to start it

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import billRoutes from './routes/billRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import merchantRoutes from './routes/merchantRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';

// CREATE EXPRESS APP
const app = express();

// MIDDLEWARE

// 1. CORS - Allow frontend to make requests
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// 2. JSON Parser - Parse JSON request bodies
app.use(express.json());

// 3. URL-encoded Parser - Parse form data
app.use(express.urlencoded({ extended: true }));

// 4. Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// ==============================================
// HEALTH CHECK ROUTE
// ==============================================
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
const API_PREFIX = '/api/v1';

// Authentication routes
app.use(`${API_PREFIX}/auth`, authRoutes);

// Transaction routes
app.use(`${API_PREFIX}/transactions`, transactionRoutes);

// Wallet routes
app.use(`${API_PREFIX}/wallets`, walletRoutes);

// QR code routes
app.use(`${API_PREFIX}/qr`, qrRoutes);

// Bill payment routes
app.use(`${API_PREFIX}/bills`, billRoutes);

// Loan management routes
app.use(`${API_PREFIX}/loans`, loanRoutes);

// Savings account routes
app.use(`${API_PREFIX}/savings`, savingsRoutes);

// Agent routes
app.use(`${API_PREFIX}/agent`, agentRoutes);

// Merchant routes
app.use(`${API_PREFIX}/merchant`, merchantRoutes);

// Admin routes
app.use(`${API_PREFIX}/admin`, adminRoutes);

// Subscription routes
app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);

// ==============================================
// ERROR HANDLING
// ==============================================

// 404 Handler - Route not found
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ... existing middleware and routes ...

/**
 * BACKGROUND WORKER: Runs every day at 00:00 (Midnight)
 * Format: 'minute hour day month day-of-week'
 */
cron.schedule('0 0 * * *', () => {
  subscriptionService.processDailyBilling();
});

// ==============================================
// START SERVER
// ==============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
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
║   Team: Wahidul Haque (2305054)                ║
║         Abu Bakar Siddique (2305059)           ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});

// ==============================================
// GRACEFUL SHUTDOWN
// ==============================================
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
