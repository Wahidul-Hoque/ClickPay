import { query } from '../config/database.js';

class WalletService {
    async getBalance(userId) {
        const result = await query(
            `SELECT balance FROM wallets WHERE user_id = $1 AND wallet_type IN ('user', 'agent')`,
            [userId]
        );
        if (result.rows.length === 0) throw new Error('Wallet not found');
        return parseFloat(result.rows[0].balance);
    }
}

export default new WalletService();
