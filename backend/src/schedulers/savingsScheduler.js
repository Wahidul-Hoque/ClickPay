import cron from 'node-cron';
import savingsService from '../services/savingsService.js';
import { query } from '../config/database.js';

const checkMaturedSavings = async () => {
  console.log('[Scheduler] Running Savings Maturity Check...');
  try {
    // Find all active accounts where finish_at is in the past
    const matured = await query(
      `SELECT fixed_savings_id, user_id FROM fixed_savings_accounts 
       WHERE status = 'active' AND finish_at <= NOW()`
    );

    if (matured.rows.length === 0) {
      console.log('[Scheduler] No matured accounts found today.');
      return;
    }

    for (const row of matured.rows) {
      try {
        // breakAccount handles both early breaking and natural maturity
        await savingsService.breakAccount(row.user_id, row.fixed_savings_id);
        console.log(`[Scheduler] Matured account #${row.fixed_savings_id} processed successfully.`);
      } catch (err) {
        console.error(`[Scheduler] Error maturing account #${row.fixed_savings_id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Savings Job Critical Error:', error.message);
  }
};

// Run every day at 00:00 (Midnight)
cron.schedule('0 0 * * *', checkMaturedSavings);

export default checkMaturedSavings;