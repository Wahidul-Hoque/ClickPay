import { query } from '../config/database.js';

class WalletService {
    async getBalance(userId) {
        const result = await query(
            `SELECT balance FROM wallets WHERE user_id = $1 AND wallet_type IN ('user', 'agent', 'merchant')`,
            [userId]
        );
        if (result.rows.length === 0) throw new Error('Wallet not found');
        return parseFloat(result.rows[0].balance);
    }
    async getCurrentMonthExpense(userId)
    {
        const result = await query(
            `select sum(t.amount) from transactions t where t.from_wallet_id=(select wallet_id from users u left join wallets w on u.user_id=w.user_id where u.user_id=$1 and w.wallet_type='user' ) and t.created_at>=date_trunc('month',current_date)  and t.transaction_type in('loan_repayment_base','cash_out','subscription_payment','bill_payment','transfer','agent_fee','agent_fee')`,[userId]
        );
        if(result.rows.length===0) return 0;
        return parseFloat(result.rows[0].sum || 0);  
    }
}

export default new WalletService();
