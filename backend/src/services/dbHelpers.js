// ──────────────────────────────────────────────────────────────
// SHARED DATABASE HELPERS
// ──────────────────────────────────────────────────────────────
// Extracted from duplicate copies in transactionService,
// billService, loanService, and paymentMethodService.

import { getClient } from '../config/database.js';

/**
 * Log a single lifecycle event for a transaction (uses a client mid-transaction)
 */
export async function logEvent(client, transactionId, eventType, eventStatus, details) {
  await client.query(
    `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
     VALUES ($1, $2, $3, $4)`,
    [transactionId, eventType, eventStatus, details]
  );
}

/**
 * After a ROLLBACK, record the failure using the database procedure.
 * Uses a fresh connection so the log is persisted even after rollback.
 */
export async function recordFailure(transactionId, errorMessage) {
  if (!transactionId) return;
  try {
    const failClient = await getClient();
    try {
      await failClient.query(
        'CALL p_record_transaction_failure($1, $2)',
        [transactionId, errorMessage]
      );
    } finally {
      failClient.release();
    }
  } catch (logErr) {
    console.error('Could not persist transaction failure log:', logErr.message);
  }
}

/**
 * Check Daily and Monthly usage against dynamic limits and trigger a notification if crossed 
 */
export async function verifyUserLimits(client, userId, walletId, category, amount) {
  const payAmount = parseFloat(amount);
  let dailySetting = '';
  let monthlySetting = '';
  let baseDaily = 0;
  let baseMonthly = 0;

  if (category === 'send_money') {
    dailySetting = 'daily_send_money_limit';
    monthlySetting = 'monthly_send_money_limit';
    baseDaily = 25000;
    baseMonthly = 100000;
  } else if (category === 'receive_money') {
    dailySetting = 'daily_receive_money_limit';
    monthlySetting = 'monthly_receive_money_limit';
    baseDaily = 50000;
    baseMonthly = 200000;
  } else if (category === 'mobile_recharge') {
    dailySetting = 'daily_mobile_recharge_limit';
    monthlySetting = 'monthly_mobile_recharge_limit';
    baseDaily = 10000;
    baseMonthly = 50000;
  } else {
    return;
  }

  const dailyLimitRes = await client.query("SELECT fn_get_system_setting($1, $2) as l", [dailySetting, baseDaily.toString()]);
  const monthlyLimitRes = await client.query("SELECT fn_get_system_setting($1, $2) as l", [monthlySetting, baseMonthly.toString()]);
  const dailyLimit = parseFloat(dailyLimitRes.rows[0].l);
  const monthlyLimit = parseFloat(monthlyLimitRes.rows[0].l);

  let dailySpent = 0;
  let monthlySpent = 0;

  if (category === 'send_money') {
    const dailyRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE from_wallet_id = $1 AND transaction_type = 'transfer' AND status = 'completed' AND created_at >= CURRENT_DATE`, [walletId]
    );
    const monthlyRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE from_wallet_id = $1 AND transaction_type = 'transfer' AND status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)`, [walletId]
    );
    dailySpent = parseFloat(dailyRes.rows[0].total);
    monthlySpent = parseFloat(monthlyRes.rows[0].total);
  } else if (category === 'receive_money') {
    const dailyRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE to_wallet_id = $1 AND transaction_type ='transfer' AND status = 'completed' AND created_at >= CURRENT_DATE`, [walletId]
    );
    const monthlyRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE to_wallet_id = $1 AND transaction_type ='transfer' AND status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)`, [walletId]
    );
    dailySpent = parseFloat(dailyRes.rows[0].total);
    monthlySpent = parseFloat(monthlyRes.rows[0].total);
  } else if (category === 'mobile_recharge') {
    const dailyRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM bill_payments WHERE wallet_id = $1 AND provider_reference LIKE 'MOBILE-%' AND status = 'completed' AND created_at >= CURRENT_DATE`, [walletId]
    );
    const monthlyRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM bill_payments WHERE wallet_id = $1 AND provider_reference LIKE 'MOBILE-%' AND status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)`, [walletId]
    );
    dailySpent = parseFloat(dailyRes.rows[0].total);
    monthlySpent = parseFloat(monthlyRes.rows[0].total);
  }

  const categoryName = category.replace('_', ' ');

  if (dailySpent + payAmount > dailyLimit) {
    if (category === 'receive_money') {
      throw new Error(`The receiver has exceeded their daily limit of ৳${dailyLimit}.`);
    } else {
      throw new Error(`Daily ${categoryName} limit (৳${dailyLimit}) exceeded.`);
    }
  }

  if (monthlySpent + payAmount > monthlyLimit) {
    if (category === 'receive_money') {
      throw new Error(`The receiver has exceeded their monthly limit of ৳${monthlyLimit}.`);
    } else {
      throw new Error(`Monthly ${categoryName} limit (৳${monthlyLimit}) exceeded.`);
    }
  }
}
