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
