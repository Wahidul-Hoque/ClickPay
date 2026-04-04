import { query } from './src/config/database.js';

async function fixTableAndInsert() {
  const settings = [
    { key: 'daily_send_money_limit', val: 25000, desc: 'Max amount a user can send per day' },
    { key: 'monthly_send_money_limit', val: 100000, desc: 'Max amount a user can send per month' },
    { key: 'daily_receive_money_limit', val: 50000, desc: 'Max amount a user can receive per day' },
    { key: 'monthly_receive_money_limit', val: 200000, desc: 'Max amount a user can receive per month' },
    { key: 'daily_mobile_recharge_limit', val: 10000, desc: 'Max amount of mobile recharge per day' },
    { key: 'monthly_mobile_recharge_limit', val: 50000, desc: 'Max amount of mobile recharge per month' },
  ];

  try {
    // 1. ALTER TABLE to fix the precision
    await query(`ALTER TABLE system_settings ALTER COLUMN setting_value TYPE NUMERIC(15,2);`);

    // 2. Insert the settings
    for (const s of settings) {
      await query(`
        INSERT INTO system_settings (setting_key, setting_value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (setting_key) DO NOTHING;
      `, [s.key, s.val.toString(), s.desc]);
    }
    console.log('Successfully altered table and inserted all limit settings!');
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    process.exit();
  }
}
fixTableAndInsert();
