// ==============================================
// MAIN ENTRY POINT (app.js)
// ==============================================
import './config/env.js';
import express from 'express';
import cors from 'cors';
import subscriptionService from './services/subscriptionService.js';
import { processSubscriptions } from './schedulers/subscriptionScheduler.js';
import checkLoanDueDates from './schedulers/loanScheduler.js';
import checkMaturedSavings from './schedulers/savingsScheduler.js';

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
import paymentMethodRoutes from './routes/paymentMethodRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
// CREATE EXPRESS APP
const app = express();

// MIDDLEWARE...

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

app.get('/api/v1/run-nightly', async (req, res) => {
  try {
    await processSubscriptions();
    await checkLoanDueDates();
    await checkMaturedSavings();

    return res.json({
      success: true,
      message: 'All nightly schedulers executed'
    });
  } catch (error) {
    console.error('Nightly schedulers failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Nightly schedulers failed',
      error: error.message
    });
  }
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

// Payment Method routes
app.use(`${API_PREFIX}/payment-methods`, paymentMethodRoutes);

// Favorite routes
app.use(`${API_PREFIX}/favorites`, favoriteRoutes);

// Notification routes
app.use(`${API_PREFIX}/notifications`, notificationRoutes);

// System Settings routes 
app.use(`${API_PREFIX}/system`, systemRoutes);

// ERROR HANDLING


// 404 Handler - Route not found
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ... existing middleware and routes ...


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