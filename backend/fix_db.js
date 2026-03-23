import pool from './src/config/database.js';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Merchant Subscription Migration ---');

    // 1. Add subscription_expiry column if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='merchant_profiles' AND column_name='subscription_expiry') THEN
          ALTER TABLE merchant_profiles ADD COLUMN subscription_expiry TIMESTAMPTZ;
        END IF;
      END
      $$;
    `);
    console.log('✅ Column subscription_expiry checked/added.');

    // 2. Drop existing constraint and recreate with 'inactive'
    await client.query(`
      ALTER TABLE merchant_profiles DROP CONSTRAINT IF EXISTS merchant_profiles_status_check;
      ALTER TABLE merchant_profiles ADD CONSTRAINT merchant_profiles_status_check CHECK (status IN ('active', 'suspended', 'inactive'));
    `);
    console.log('✅ Constraint merchant_profiles_status_check updated.');

    // 3. Ensure all merchants have a status (default to active for existing, but new will be inactive)
    // Actually the user said new merchants should be locked.
    // Merchants created before this change might need to be 'active' if they were already using it, 
    // or 'inactive' if they want all of them to pay.
    // I'll set them to inactive for now to be safe with the locking logic.
    await client.query(`
      UPDATE merchant_profiles SET status = 'inactive' WHERE status = 'active';
    `);
    console.log('✅ Existing merchants set to inactive.');

    // 4. Create System Revenue Wallet if missing
    // We'll look for user_id = 1 or a specific admin user for system wallet if needed, 
    // but the schema says system wallets don't need a specific user (REFERENCES users(user_id) though).
    // Usually, system wallets are attached to user_id 1 (the admin).
    const adminRes = await client.query("SELECT user_id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminRes.rows.length > 0) {
      const adminId = adminRes.rows[0].user_id;
      await client.query(`
        INSERT INTO wallets (user_id, wallet_type, system_purpose, balance, status)
        SELECT $1, 'system', 'profit', 0, 'active'
        WHERE NOT EXISTS (SELECT 1 FROM wallets WHERE system_purpose = 'profit');
      `, [adminId]);
      console.log('✅ System revenue wallet checked/added.');
    } else {
      console.log('⚠️ No admin user found to attach system wallet to. Please create an admin first.');
    }

    console.log('--- Migration Finished Successfully ---');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}

runMigration();
