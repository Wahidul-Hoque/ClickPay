// ==============================================
// OTHER ROUTES (Placeholders)
// ==============================================
// Routes for features to be implemented later

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

// ==============================================
// WALLET ROUTES
// ==============================================
const walletRouter = express.Router();

walletRouter.get('/balance', protect, (req, res) => {
  // TODO: Implement get balance
  res.json({ success: true, message: 'Get balance - To be implemented' });
});

walletRouter.post('/topup', protect, (req, res) => {
  // TODO: Implement external top-up
  res.json({ success: true, message: 'Top-up - To be implemented' });
});

walletRouter.get('/payment-methods', protect, (req, res) => {
  // TODO: Implement get payment methods
  res.json({ success: true, message: 'Get payment methods - To be implemented' });
});

walletRouter.post('/payment-methods', protect, (req, res) => {
  // TODO: Implement add payment method
  res.json({ success: true, message: 'Add payment method - To be implemented' });
});

// ==============================================
// QR CODE ROUTES
// ==============================================
const qrRouter = express.Router();

qrRouter.post('/generate', protect, (req, res) => {
  // TODO: Implement QR code generation
  res.json({ success: true, message: 'Generate QR - To be implemented' });
});

qrRouter.post('/scan', protect, (req, res) => {
  // TODO: Implement QR code scanning
  res.json({ success: true, message: 'Scan QR - To be implemented' });
});

qrRouter.get('/my-codes', protect, (req, res) => {
  // TODO: Implement get user's QR codes
  res.json({ success: true, message: 'Get my QR codes - To be implemented' });
});

// ==============================================
// BILL PAYMENT ROUTES
// ==============================================
const billRouter = express.Router();

billRouter.get('/billers', protect, (req, res) => {
  // TODO: Implement get billers
  res.json({ success: true, message: 'Get billers - To be implemented' });
});

billRouter.post('/pay', protect, (req, res) => {
  // TODO: Implement bill payment
  res.json({ success: true, message: 'Pay bill - To be implemented' });
});

billRouter.get('/history', protect, (req, res) => {
  // TODO: Implement bill payment history
  res.json({ success: true, message: 'Bill payment history - To be implemented' });
});

// ==============================================
// LOAN ROUTES
// ==============================================
const loanRouter = express.Router();

loanRouter.post('/apply', protect, (req, res) => {
  // TODO: Implement loan application
  res.json({ success: true, message: 'Apply for loan - To be implemented' });
});

loanRouter.get('/my-loans', protect, (req, res) => {
  // TODO: Implement get user's loans
  res.json({ success: true, message: 'Get my loans - To be implemented' });
});

loanRouter.post('/repay/:loanId', protect, (req, res) => {
  // TODO: Implement loan repayment
  res.json({ success: true, message: 'Repay loan - To be implemented' });
});

// ==============================================
// SAVINGS ROUTES
// ==============================================
const savingsRouter = express.Router();

savingsRouter.post('/create', protect, (req, res) => {
  // TODO: Implement create savings account
  res.json({ success: true, message: 'Create savings - To be implemented' });
});

savingsRouter.get('/my-savings', protect, (req, res) => {
  // TODO: Implement get user's savings
  res.json({ success: true, message: 'Get my savings - To be implemented' });
});

savingsRouter.post('/break/:savingsId', protect, (req, res) => {
  // TODO: Implement break savings account
  res.json({ success: true, message: 'Break savings - To be implemented' });
});

// Export all routers
export {
  walletRouter,
  qrRouter,
  billRouter,
  loanRouter,
  savingsRouter
};
