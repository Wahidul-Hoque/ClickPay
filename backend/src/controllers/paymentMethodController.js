import paymentMethodService from '../services/paymentMethodService.js';

// 1. Get available banks/cards for the dropdowns
export const getOptions = async (req, res, next) => {
  try {
    const data = await paymentMethodService.getOptions();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// 2. Link a new Bank or Card (Handshake)
export const linkMethod = async (req, res, next) => {
  try {
    //console.log("Full User Object from Token:", req.user);
    const result = await paymentMethodService.linkMethod(req.user.userId, req.body);
    res.status(201).json({ 
      success: true, 
      message: 'Method linked successfully!', 
      data: result 
    });
  } catch (err) {
    next(err);
  }
};

// 3. Get the user's linked accounts for the "Add Money" screen
export const getMyMethods = async (req, res, next) => {
  try {
    //console.log("Full User Object from Token:", req.user);
    const methods = await paymentMethodService.getMyMethods(req.user.userId);
    res.json({ success: true, data: methods });
  } catch (err) {
    next(err);
  }
};

// 4. THE TOP-UP ACTION (Add Money)
export const topupWallet = async (req, res, next) => {
  try {
    const { methodId, amount } = req.body;
    const result = await paymentMethodService.topupWallet(req.user.userId, methodId, amount);
    res.json({ 
      success: true, 
      message: 'Top-up successful!', 
      data: result 
    });
  } catch (err) {
    // This will catch the "Insufficient Funds" error from the service 
    // and show it to the user in the frontend.
    next(err);
  }
};