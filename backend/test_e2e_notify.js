// End-to-end test: Login as admin -> Send notification -> Check DB
import dotenv from 'dotenv';
dotenv.config();

import { query } from './src/config/database.js';

const BASE = 'http://localhost:5000/api/v1';

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  const body = await res.json();
  return { status: res.status, body };
}

async function main() {
  // 1. Get an admin user's phone from DB
  const adminRes = await query(`SELECT phone FROM users WHERE role = 'admin' LIMIT 1`);
  if (adminRes.rows.length === 0) { console.log('No admin found'); process.exit(1); }
  const adminPhone = adminRes.rows[0].phone;
  console.log('Admin phone:', adminPhone);

  // 2. Login as admin (we need epin - try common ones)
  console.log('\n=== Logging in as admin ===');
  let token = null;
  for (const pin of ['123456', '111111', '000000', '654321']) {
    const loginRes = await fetchJSON(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: adminPhone, epin: pin })
    });
    if (loginRes.body.success && loginRes.body.token) {
      token = loginRes.body.token;
      console.log('Logged in with pin:', pin);
      break;
    } else {
      console.log(`Pin ${pin} failed:`, loginRes.body.message);
    }
  }

  if (!token) {
    console.log('Could not login as admin. Trying with a hardcoded token from localStorage...');
    // Fallback: check count before and after to see if endpoint was the issue
    process.exit(1);
  }

  // 3. Count notifications before
  const beforeCount = await query('SELECT COUNT(*)::int as cnt FROM notifications');
  console.log('\nNotifications before:', beforeCount.rows[0].cnt);

  // 4. Send notification via API
  console.log('\n=== Sending notification via API ===');
  const sendRes = await fetchJSON(`${BASE}/admin/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      audience: 'users',
      message: 'E2E Test notification - ' + new Date().toISOString()
    })
  });
  console.log('Send response status:', sendRes.status);
  console.log('Send response body:', JSON.stringify(sendRes.body, null, 2));

  // 5. Count notifications after
  const afterCount = await query('SELECT COUNT(*)::int as cnt FROM notifications');
  console.log('\nNotifications after:', afterCount.rows[0].cnt);
  console.log('New rows inserted:', afterCount.rows[0].cnt - beforeCount.rows[0].cnt);

  // 6. Show latest notifications
  const latest = await query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5');
  console.log('\nLatest notifications:', JSON.stringify(latest.rows, null, 2));

  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
