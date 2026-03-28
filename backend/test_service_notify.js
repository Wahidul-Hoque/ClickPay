// Direct service test - bypasses the HTTP layer
import dotenv from 'dotenv';
dotenv.config();

import { query } from './src/config/database.js';
import notificationService from './src/services/notificationService.js';

async function main() {
  try {
    // 1. Count before
    const before = await query('SELECT COUNT(*)::int as cnt FROM notifications');
    console.log('Before count:', before.rows[0].cnt);

    // 2. Get admin id
    const adminRes = await query(`SELECT user_id FROM users WHERE role = 'admin' LIMIT 1`);
    const adminId = adminRes.rows[0].user_id;
    console.log('Admin ID:', adminId);

    // 3. Call the service directly
    console.log('\n--- Calling sendAdminNotification(audience=users) ---');
    const result = await notificationService.sendAdminNotification({
      adminId: adminId,
      message: 'Direct service test - ' + new Date().toISOString(),
      audience: 'users',
      phone: undefined
    });
    console.log('Result:', JSON.stringify(result, null, 2));

    // 4. Count after
    const after = await query('SELECT COUNT(*)::int as cnt FROM notifications');
    console.log('\nAfter count:', after.rows[0].cnt);
    console.log('Rows inserted:', after.rows[0].cnt - before.rows[0].cnt);

    // 5. Show latest
    const latest = await query('SELECT notification_id, user_id, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 5');
    console.log('\nLatest:', JSON.stringify(latest.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

main();
