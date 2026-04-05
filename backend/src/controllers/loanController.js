import loanService from '../services/loanService.js';

class LoanController {
  // Retrieves current loan state, active applications, and eligibility for the user
  async getStatus(req, res, next) {
    try {
      const data = await loanService.getLoanData(req.user.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  // Processes a new loan application after validating requested amount against user limits
  async apply(req, res, next) {
    try {
      const result = await loanService.applyForLoan(req.user.userId, req.body.amount);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  // Finalizes the full repayment of an active loan using current wallet balance
  async repay(req, res, next) {
    try {
      const result = await loanService.repayLoan(req.user.userId, req.params.loanId);
      res.json({ success: true, message: `Repaid ৳${result.totalPaid} successfully`, data: result });
    } catch (error) {
      if (error.message.includes('balance')) return res.status(400).json({ success: false, message: error.message });
      next(error);
    }
  }

  // Lists all pending loan applications for administrative review and decision
  async adminGetAll(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : null;
      const status = req.query.status || 'submitted';
      const applications = await loanService.getAllApplications(status, limit);
      res.json({ success: true, data: applications });
    } catch (error) { next(error); }
  }

  // Authorizes and disburses funds for an approved loan application
  async adminApprove(req, res, next) {
    try {
      await loanService.approveLoan(req.user.userId, req.params.id);
      res.json({ success: true, message: "Loan approved, disbursed and recorded." });
    } catch (error) { next(error); }
  }

  // Rejects a pending loan application and logs the administrative action
  async adminReject(req, res, next) {
    try {
      await loanService.rejectLoan(req.user.userId,req.params.id);
      res.json({ success: true, message: "Loan application rejected." });
    } catch (error) { next(error); }
  }

  // Provides a comprehensive list of all historical and active loans across the platform
  async adminGetDetailedLoans(req, res, next) {
    try {
      const data = await loanService.getAllLoansDetailed();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}

export default new LoanController();