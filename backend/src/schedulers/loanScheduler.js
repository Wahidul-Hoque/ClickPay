import cron from 'node-cron';
import loanService from '../services/loanService.js';

const checkLoanDueDates = async () => {
    console.log('[Scheduler] Running Loan Due Date Check...');
    try {
        await loanService.processLoanDefaults();
    } catch (error) {
        console.error('[Scheduler] Loan Job Critical Error:', error.message);
    }
};

// Run every day at 00:00 (Midnight)
cron.schedule('0 0 * * *', checkLoanDueDates);

// To test it faster, you could run it every minute during dev:
// cron.schedule('* * * * *', checkLoanDueDates);

export default checkLoanDueDates;
