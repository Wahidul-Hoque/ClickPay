import loanService from '../services/loanService.js';

class LoanController {
  async getStatus(req, res, next) {
    try {
      const data = await loanService.getLoanData(req.user.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async apply(req, res, next) {
    try {
      const result = await loanService.applyForLoan(req.user.userId, req.body.amount);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async repay(req, res, next) {
    try {
      const result = await loanService.repayLoan(req.user.userId, req.params.loanId);
      res.json({ success: true, message: `Repaid ৳${result.totalPaid} successfully`, data: result });
    } catch (error) {
      if (error.message.includes('balance')) return res.status(400).json({ success: false, message: error.message });
      next(error);
    }
  }

  async adminGetAll(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : null;
      const applications = await loanService.getAllApplications('submitted', limit);
      res.json({ success: true, data: applications });
    } catch (error) { next(error); }
  }

  async adminApprove(req, res, next) {
    try {
      await loanService.approveLoan(req.user.userId, req.params.id);
      res.json({ success: true, message: "Loan approved, disbursed and recorded." });
    } catch (error) { next(error); }
  }

  async adminReject(req, res, next) {
    try {
      await loanService.rejectLoan(req.params.id);
      res.json({ success: true, message: "Loan application rejected." });
    } catch (error) { next(error); }
  }

  async adminGetDetailedLoans(req, res, next) {
    try {
      const data = await loanService.getAllLoansDetailed();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}

export default new LoanController();