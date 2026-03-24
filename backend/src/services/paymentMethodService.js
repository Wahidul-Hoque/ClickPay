import { query, getClient } from '../config/database.js';

// ──────────────────────────────────────────────────────────────
// INTERNAL HELPERS (Matches your BillService pattern)
// ──────────────────────────────────────────────────────────────

async function logEvent(client, transactionId, eventType, eventStatus, details) {
  await client.query(
    `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
     VALUES ($1, $2, $3, $4)`,
    [transactionId, eventType, eventStatus, details]
  );
}

// ──────────────────────────────────────────────────────────────
// PAYMENT METHOD SERVICE
// ──────────────────────────────────────────────────────────────

class PaymentMethodService {

  // 1. GET OPTIONS (Banks & Card Networks)
  async getOptions() {
    const banks = await query('SELECT bank_id, name FROM banks ORDER BY name');
    const networks = await query('SELECT network_id, name FROM card_networks ORDER BY name');
    return { banks: banks.rows, networks: networks.rows };
  }

  // 2. LINK A NEW METHOD (Handshake)
  async linkMethod(userId, data) {
    const { type, bankId, networkId, phoneNumber, bankPin, cardNumber, expiryDate, cvv } = data;

    // Step A: Verify against the "Outer World" (Mock Bank/Card)
    let mockId = null;
    if (type === 'bank') {
      const res = await query(
        `SELECT account_id FROM mock_bank_accounts 
         WHERE bank_id = $1 AND phone_number = $2 AND bank_pin = $3`,
        [bankId, phoneNumber, bankPin]
      );
      if (res.rows.length === 0) throw new Error('Invalid Bank credentials or account not found');
      mockId = res.rows[0].account_id;
    } else {
      const res = await query(
        `SELECT card_id FROM mock_card_accounts 
         WHERE network_id = $1 AND card_number = $2 AND expiry_date = $3 AND cvv = $4`,
        [networkId, cardNumber, expiryDate, cvv]
      );
      if (res.rows.length === 0) throw new Error('Invalid Card details or card not found');
      mockId = res.rows[0].card_id;
    }

    // Step B: Create the Link in our App
    const insertQuery = type === 'bank'
      ? `INSERT INTO user_payment_methods (user_id, method_type, mock_bank_account_id) VALUES ($1, $2, $3) RETURNING *`
      : `INSERT INTO user_payment_methods (user_id, method_type, mock_card_account_id) VALUES ($1, $2, $3) RETURNING *`;

    const linkRes = await query(insertQuery, [userId, type, mockId]);
    return linkRes.rows[0];
  }
//add method for topup wallet
async topupWallet(userId, methodId, amount) {
  const client = await getClient();
  let transactionId = null;
  const topupAmount = parseFloat(amount);

  try {
    await client.query('BEGIN');
    // We fetch the link to ensure this specific user owns this payment method
    const linkRes = await client.query(
      `SELECT * FROM user_payment_methods 
       WHERE method_id = $1 AND user_id = $2 AND status = 'active'`,
      [methodId, userId]
    );

    if (linkRes.rows.length === 0) {
      throw new Error('Payment method not found or access denied');
    }
    const method = linkRes.rows[0];

    // ── Step 2: Lock & Verify External Balance (The "Handshake" side) ──
    let currentMockBalance = 0;
    let externalId = null;
    let providerName = '';

    if (method.method_type === 'bank') {
      const bankRes = await client.query(
        `SELECT mba.current_balance, b.name FROM mock_bank_accounts mba 
         JOIN banks b ON mba.bank_id = b.bank_id
         WHERE mba.account_id = $1 FOR UPDATE`,
        [method.mock_bank_account_id]
      );
      if (bankRes.rows.length === 0) throw new Error('Bank account details missing');
      currentMockBalance = parseFloat(bankRes.rows[0].current_balance);
      providerName = bankRes.rows[0].name;
      externalId = method.mock_bank_account_id;
    } else {
      const cardRes = await client.query(
        `SELECT mca.current_balance, cn.name FROM mock_card_accounts mca 
         JOIN card_networks cn ON mca.network_id = cn.network_id
         WHERE mca.card_id = $1 FOR UPDATE`,
        [method.mock_card_account_id]
      );
      if (cardRes.rows.length === 0) throw new Error('Card details missing');
      currentMockBalance = parseFloat(cardRes.rows[0].current_balance);
      providerName = cardRes.rows[0].name;
      externalId = method.mock_card_account_id;
    }

    // ── Step 3: Insufficient Funds Check (The 4000 TK Check) ──
    if (currentMockBalance < topupAmount) {
      throw new Error(`Insufficient funds in your ${providerName} account. Available: ৳${currentMockBalance.toFixed(2)}`);
    }

    // ── Step 4: Lock User's ClickPay Wallet ──
    const walletRes = await client.query(
      `SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND wallet_type IN ('user','agent','merchant') FOR UPDATE`,
      [userId]
    );
    if (walletRes.rows.length === 0) throw new Error('ClickPay wallet not found');
    console.log(`Locked wallet for user ${userId}. Current balance: ৳${walletRes.rows[0].balance}`);
    const wallet = walletRes.rows[0];


    // ── Step 6: Deduct from Mock External World ──
    if (method.method_type === 'bank') {

      // ── Step 5: Log Initial Transaction (Main Ledger) ──
    const txnRes = await client.query(
      `INSERT INTO transactions 
         (from_bank_account_id, to_wallet_id, amount, transaction_type, status, reference)
       VALUES ($1, $2, $3, 'bank_transfer', 'initiated', $4)
       RETURNING transaction_id`,
      [externalId, wallet.wallet_id, topupAmount, `Top-up from ${providerName}`]
    );
    transactionId = txnRes.rows[0].transaction_id;

    await logEvent(client, transactionId, 'initiated', 'info', `Adding money from ${providerName}`);

      await client.query(
        'UPDATE mock_bank_accounts SET current_balance = current_balance - $1 WHERE account_id = $2', 
        [topupAmount, externalId]
      );
    } else {

      // ── Step 5: Log Initial Transaction (Main Ledger) ──
    const txnRes = await client.query(
      `INSERT INTO transactions 
         (from_card_account_id, to_wallet_id, amount, transaction_type, status, reference)
       VALUES ($1, $2, $3, 'bank_transfer', 'initiated', $4)
       RETURNING transaction_id`,
      [externalId, wallet.wallet_id, topupAmount, `Top-up from ${providerName}`]
    );
    transactionId = txnRes.rows[0].transaction_id;

    await logEvent(client, transactionId, 'initiated', 'info', `Adding money from ${providerName}`);
      await client.query(
        'UPDATE mock_card_accounts SET current_balance = current_balance - $1 WHERE card_id = $2', 
        [topupAmount, externalId]
      );
    }

    // ── Step 7: Credit User's ClickPay Wallet ──
    await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', 
      [topupAmount, wallet.wallet_id]
    );
    
    // Get final balance for confirmation
    const finalBalRes = await client.query('SELECT balance FROM wallets WHERE wallet_id = $1', [wallet.wallet_id]);
    console.log(`Final balance for user ${userId} after top-up: ৳${finalBalRes.rows[0].balance}`);
    const finalBalance = finalBalRes.rows[0].balance;

    // ── Step 8: RECORD IN external_topups TABLE ──
    await client.query(
      `INSERT INTO external_topups 
         (wallet_id, method_id, amount, status, transaction_id)
       VALUES ($1, $2, $3, 'completed', $4)`,
      [wallet.wallet_id, methodId, topupAmount, transactionId]
    );

    // ── Step 9: Finalize Transaction Status ──
    await client.query(`UPDATE transactions SET status = 'completed' WHERE transaction_id = $1`, [transactionId]);
    await logEvent(client, transactionId, 'completed', 'success', `৳${topupAmount} added. New Wallet Bal: ৳${finalBalance}`);

    await client.query('COMMIT');

    return { 
      success: true, 
      amount: topupAmount, 
      transaction_id: transactionId,
      new_balance: finalBalance,
      provider: providerName
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

  // 4. GET MY METHODS
  async getMyMethods(userId) {
    const res = await query(
      `SELECT upm.method_id, upm.method_type, upm.status,
              b.name as bank_name, cn.name as network_name,
              COALESCE(mba.phone_number, mca.card_number) as identifier
       FROM user_payment_methods upm
       LEFT JOIN mock_bank_accounts mba ON upm.mock_bank_account_id = mba.account_id
       LEFT JOIN banks b ON mba.bank_id = b.bank_id
       LEFT JOIN mock_card_accounts mca ON upm.mock_card_account_id = mca.card_id
       LEFT JOIN card_networks cn ON mca.network_id = cn.network_id
       WHERE upm.user_id = $1 AND upm.status = 'active'`,
      [userId]
    );
    return res.rows;
  }
}

export default new PaymentMethodService();