// ==============================================
// QR CODE ROUTES (PLACEHOLDER)
// ==============================================
import express from 'express';
import { protect } from '../utils/auth.js';
const qrRouter = express.Router();

qrRouter.post('/generate', protect, (req, res) => {
  // TODO: Generate QR code for payments
  res.json({ success: true, message: 'QR generation - To be implemented' });
});

qrRouter.post('/scan', protect, (req, res) => {
  // TODO: Scan and process QR code payment
  res.json({ success: true, message: 'QR scan - To be implemented' });
});

export const qr = qrRouter;

// ==============================================
// BILL PAYMENT ROUTES (PLACEHOLDER)
// ==============================================
const billRouter = express.Router();

billRouter.get('/billers', protect, (req, res) => {
  // TODO: Get list of available billers
  res.json({ success: true, message: 'Get billers - To be implemented' });
});

billRouter.post('/pay', protect, (req, res) => {
  // TODO: Pay utility bill
  res.json({ success: true, message: 'Bill payment - To be implemented' });
});

export const bills = billRouter;

// ==============================================
// LOAN ROUTES (PLACEHOLDER)
// ==============================================
const loanRouter = express.Router();

loanRouter.post('/apply', protect, (req, res) => {
  // TODO: Submit loan application
  res.json({ success: true, message: 'Loan application - To be implemented' });
});

loanRouter.get('/my-loans', protect, (req, res) => {
  // TODO: Get user's loans
  res.json({ success: true, message: 'Get loans - To be implemented' });
});

loanRouter.post('/repay/:loanId', protect, (req, res) => {
  // TODO: Repay loan
  res.json({ success: true, message: 'Loan repayment - To be implemented' });
});

export const loans = loanRouter;

// ==============================================
// SAVINGS ROUTES (PLACEHOLDER)
// ==============================================
const savingsRouter = express.Router();

savingsRouter.post('/create', protect, (req, res) => {
  // TODO: Create fixed savings account
  res.json({ success: true, message: 'Create savings - To be implemented' });
});

savingsRouter.get('/my-savings', protect, (req, res) => {
  // TODO: Get user's savings accounts
  res.json({ success: true, message: 'Get savings - To be implemented' });
});

export const savings = savingsRouter;
