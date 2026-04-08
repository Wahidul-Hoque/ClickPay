
import loanService from '../services/loanService.js';

const checkLoanDueDates = async () => {
    console.log('[Scheduler] Running Loan Due Date Check...');
    try {
        await loanService.processLoanDefaults();
    } catch (error) {
        console.error('[Scheduler] Loan Job Critical Error:', error.message);
    }
};





export default checkLoanDueDates;
