// Quick test script for notification sending
import dotenv from 'dotenv';
dotenv.config();

import { query, getClient } from './src/config/database.js';

async function testNotifications() {
  try {
    // 1. Check if notifications table exists
    console.log('\n=== 1. Check notifications table ===');
    const tableCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `);
    console.log('Columns:', tableCheck.rows);

    // 2. Count existing notifications
    console.log('\n=== 2. Count existing notifications ===');
    const countRes = await query('SELECT COUNT(*) as cnt FROM notifications');
    console.log('Current count:', countRes.rows[0].cnt);

    // 3. Get a sample user
    console.log('\n=== 3. Find a sample user ===');
    const userRes = await query(`SELECT user_id, name, phone, role FROM users WHERE role = 'user' AND status = 'active' LIMIT 3`);
    console.log('Found users:', userRes.rows);

    if (userRes.rows.length === 0) {
      console.log('No active users found!');
      process.exit(1);
    }

    // 4. Try inserting a test notification
    const testUserId = userRes.rows[0].user_id;
    console.log(`\n=== 4. Insert test notification for user_id=${testUserId} ===`);
    const insertRes = await query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *',
      [testUserId, 'Test notification from debug script']
    );
    console.log('Inserted:', insertRes.rows[0]);

    // 5. Verify it exists
    console.log('\n=== 5. Verify insertion ===');
    const verifyRes = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3', [testUserId]);
    console.log('User notifications:', verifyRes.rows);

    // 6. Count all roles
    console.log('\n=== 6. Users by role ===');
    const rolesRes = await query(`SELECT role, status, COUNT(*) as cnt FROM users GROUP BY role, status ORDER BY role`);
    console.log('Roles:', rolesRes.rows);

    console.log('\n=== DONE ===');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Detail:', err);
    process.exit(1);
  }
}

testNotifications();
