import { query } from './backend/src/config/database.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('backend', '.env') });

async function migrate() {
    try {
        console.log('--- SYSTEM SETTINGS MIGRATION STARTED ---');
        
        await query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value NUMERIC(10,5) NOT NULL,
                description TEXT,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Table created');

        const { rows: existing } = await query('SELECT setting_key FROM system_settings');
        const existingKeys = existing.map(r => r.setting_key);

        const defaults = [
            ['send_money_fee', 5.00, 'Fixed fee for send money transaction (non-favorite)'],
            ['cashout_system_fee', 0.01, 'System profit portion of cashout fee (1%)'],
            ['agent_commission_fee', 0.005, 'Agent commission portion of cashout fee (0.5%)'],
            ['merchant_fee', 0.0125, 'Fee percentage for merchant disbursements (1.25%)'],
            ['loan_interest_rate', 0.09, 'Default interest rate for loans'],
            ['savings_interest_rate', 0.07, 'Annual interest rate for fixed savings']
        ];

        for (const [key, value, desc] of defaults) {
            if (!existingKeys.includes(key)) {
                await query(
                    'INSERT INTO system_settings (setting_key, setting_value, description) VALUES ($1, $2, $3)',
                    [key, value, desc]
                );
                console.log(`✅ Seeded ${key}`);
            }
        }

        console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
