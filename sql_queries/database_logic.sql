-- ==========================================
-- 1. FUNCTIONS (5)
-- Used for computations, lookups, and deterministic logic.
-- ==========================================

-- Function 1: Get Total User Balance
-- Calculates the total balance from all active wallets belonging to a user.
CREATE OR REPLACE FUNCTION fn_get_user_total_balance(p_user_id BIGINT) 
RETURNS NUMERIC AS $$
DECLARE
    v_total NUMERIC;
BEGIN
    SELECT COALESCE(SUM(balance), 0) INTO v_total 
    FROM wallets 
    WHERE user_id = p_user_id AND status = 'active' AND wallet_type='user';
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get Merchant Monthly Cash Flow
-- Calculates the total financial inflow and outflow for a merchant from the start of the current month.
CREATE OR REPLACE FUNCTION fn_get_merchant_monthly_flow(
    p_merchant_wallet_id BIGINT,
    OUT total_inflow NUMERIC,
    OUT total_outflow NUMERIC
) AS $$
BEGIN
    -- Calculate Cash Inflow (Money received by merchant)
    SELECT COALESCE(SUM(amount), 0) INTO total_inflow 
    FROM transactions 
    WHERE to_wallet_id = p_merchant_wallet_id 
      AND status = 'completed'
      AND created_at >= date_trunc('month', NOW());
      
    -- Calculate Cash Outflow (Money sent/paid out by merchant)
    SELECT COALESCE(SUM(amount), 0) INTO total_outflow 
    FROM transactions 
    WHERE from_wallet_id = p_merchant_wallet_id 
      AND status = 'completed'
      AND created_at >= date_trunc('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Function 3: Get Monthly Spending
-- Tracks how much a user's wallet has spent in a specific month for charts.
CREATE OR REPLACE FUNCTION fn_get_monthly_spending(p_wallet_id BIGINT, p_month_start TIMESTAMPTZ) 
RETURNS NUMERIC AS $$
DECLARE
    v_spent NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_spent
    FROM transactions 
    WHERE from_wallet_id = p_wallet_id 
      AND status = 'completed'
      AND created_at >= p_month_start 
      AND created_at < (p_month_start + INTERVAL '1 month');
    RETURN v_spent;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Check For Suspected Fraud (Frequency Basis)
-- Returns true if the wallet has executed 5 or more transactions in the last hour.
CREATE OR REPLACE FUNCTION fn_is_fraud_suspected(p_wallet_id BIGINT) 
RETURNS BOOLEAN AS $$
DECLARE
    v_recent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_recent_count 
    FROM transactions 
    WHERE from_wallet_id = p_wallet_id 
      AND created_at >= NOW() - INTERVAL '1 hour';
      
    RETURN v_recent_count >= 5;
END;
$$ LANGUAGE plpgsql;

-- Function 5: Generate Unique Transaction Reference
-- Creates a randomized secure reference ID for new transactions.
CREATE OR REPLACE FUNCTION fn_generate_tx_ref() 
RETURNS VARCHAR AS $$
DECLARE
    v_ref VARCHAR;
BEGIN
    v_ref := 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));
    RETURN v_ref;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 2. PROCEDURES (5)
-- Used for executing state-changing transactions atomically.
-- ==========================================

-- Procedure 1: Transfer Funds
-- Ensures secure double-entry accounting between two active wallets.
CREATE OR REPLACE PROCEDURE sp_transfer_funds(
    p_from_wallet_id BIGINT, 
    p_to_wallet_id BIGINT, 
    p_amount NUMERIC, 
    p_tx_type VARCHAR
)
AS $$
DECLARE
    v_from_status VARCHAR;
    v_to_status VARCHAR;
BEGIN
    -- Check wallet statuses
    SELECT status INTO v_from_status FROM wallets WHERE wallet_id = p_from_wallet_id FOR UPDATE;
    SELECT status INTO v_to_status FROM wallets WHERE wallet_id = p_to_wallet_id FOR UPDATE;
    
    IF v_from_status != 'active' OR v_to_status != 'active' THEN
        RAISE EXCEPTION 'One or more wallets are not active.';
    END IF;

    -- Update balances securely
    UPDATE wallets SET balance = balance - p_amount WHERE wallet_id = p_from_wallet_id;
    UPDATE wallets SET balance = balance + p_amount WHERE wallet_id = p_to_wallet_id;
    
    -- Insert Transaction record
    INSERT INTO transactions(from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
    VALUES (p_from_wallet_id, p_to_wallet_id, p_amount, p_tx_type, 'completed', fn_generate_tx_ref());
    
END;
$$ LANGUAGE plpgsql;

-- Procedure 2: Freeze User Account
-- Freezes a user's account and logs the admin's action.
CREATE OR REPLACE PROCEDURE sp_freeze_user_account(
    p_target_user_id BIGINT, 
    p_admin_id BIGINT, 
    p_reason TEXT
)
AS $$
BEGIN
    UPDATE users SET status = 'frozen' WHERE user_id = p_target_user_id;
    UPDATE wallets SET status = 'frozen' WHERE user_id = p_target_user_id;
    
    INSERT INTO admin_activity_logs(admin_user_id, action_type, target_id, description)
    VALUES (p_admin_id, 'FREEZE_USER', p_target_user_id::TEXT, p_reason);
END;
$$ LANGUAGE plpgsql;

-- Procedure 3: Dismiss Fraud Alert
-- Dismisses an alert and leaves a tracking note from the assigned admin.
CREATE OR REPLACE PROCEDURE sp_dismiss_fraud_alert(
    p_alert_id BIGINT, 
    p_admin_id BIGINT, 
    p_note TEXT
)
AS $$
BEGIN
    UPDATE fraud_alerts 
    SET status = 'dismissed', resolved_by = p_admin_id, resolved_at = NOW(), resolution_note = p_note
    WHERE alert_id = p_alert_id;
    
    INSERT INTO admin_activity_logs(admin_user_id, action_type, target_id, description)
    VALUES (p_admin_id, 'DISMISS_FRAUD', p_alert_id::TEXT, p_note);
END;
$$ LANGUAGE plpgsql;

-- Procedure 4: Process Agent Cashout
-- Settles standard user and agent cashout processes, while creating agent_fees logs.
CREATE OR REPLACE PROCEDURE sp_process_agent_cashout(
    p_user_wallet_id BIGINT, 
    p_agent_wallet_id BIGINT, 
    p_amount NUMERIC, 
    p_fee_amount NUMERIC
)
AS $$
DECLARE
    v_tx_id BIGINT;
BEGIN
    UPDATE wallets SET balance = balance - (p_amount + p_fee_amount) WHERE wallet_id = p_user_wallet_id;
    UPDATE wallets SET balance = balance + p_amount WHERE wallet_id = p_agent_wallet_id;
    
    INSERT INTO transactions(from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
    VALUES (p_user_wallet_id, p_agent_wallet_id, p_amount, 'cash_out', 'completed', fn_generate_tx_ref())
    RETURNING transaction_id INTO v_tx_id;
    
    INSERT INTO agent_fees(cashout_transaction_id, agent_wallet_id, fee_amount)
    VALUES (v_tx_id, p_agent_wallet_id, p_fee_amount);
END;
$$ LANGUAGE plpgsql;

-- Procedure 5: Mark Loan as Repaid
-- Marks an active loan as repaid if the transaction succeeds.
CREATE OR REPLACE PROCEDURE sp_repay_loan(
    p_loan_id BIGINT, 
    p_tx_id BIGINT
)
AS $$
BEGIN
    UPDATE loans 
    SET status = 'repaid', repayment_transaction_id = p_tx_id 
    WHERE loan_id = p_loan_id AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. TRIGGERS (5)
-- Automates background tasks dynamically around events.
-- ==========================================

-- Trigger 1: Auto-Create Default Wallet
-- When a user is registered, standard wallets are automatically added.
CREATE OR REPLACE FUNCTION fn_create_default_wallet() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets(user_id, wallet_type, status)
    VALUES (NEW.user_id, NEW.role, 'active');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_user_insert ON users;
CREATE TRIGGER trg_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION fn_create_default_wallet();

-- Trigger 2: Log Initial Transaction Event
-- Ensures every transaction gets at least one tracking entry.
CREATE OR REPLACE FUNCTION fn_log_transaction_event() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO transaction_events(transaction_id, event_type, event_status, details)
    VALUES (NEW.transaction_id, 'CREATED', 'info', 'Transaction ' || NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_transaction_insert ON transactions;
CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION fn_log_transaction_event();

-- Trigger 3: Prevent Update on Frozen Wallets
-- Enforces wallet statuses at the lowest database level to prevent errors.
CREATE OR REPLACE FUNCTION fn_check_wallet_active() 
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'frozen' OR OLD.status = 'closed' THEN
        RAISE EXCEPTION 'Cannot modify balance of a frozen or closed wallet';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_wallet_update ON wallets;
CREATE TRIGGER trg_before_wallet_update
BEFORE UPDATE OF balance ON wallets
FOR EACH ROW
EXECUTE FUNCTION fn_check_wallet_active();

-- Trigger 4: Enforce Transaction Immutability
-- Prevents completed or failed transactions from ever being tampered with.
CREATE OR REPLACE FUNCTION fn_enforce_transaction_immutability() 
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('completed', 'failed', 'reversed') AND 
       (OLD.status IS DISTINCT FROM NEW.status OR OLD.amount IS DISTINCT FROM NEW.amount OR OLD.from_wallet_id IS DISTINCT FROM NEW.from_wallet_id OR OLD.to_wallet_id IS DISTINCT FROM NEW.to_wallet_id) THEN
        RAISE EXCEPTION 'Security protocol blocked tampering with a finalized transaction. (Status: %)', OLD.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_transaction_update ON transactions;
CREATE TRIGGER trg_before_transaction_update
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION fn_enforce_transaction_immutability();

-- Trigger 5: Auto-Update Timestamp for System Settings
-- Ensures "updated_at" is kept accurately accurate for configuration audits.
CREATE OR REPLACE FUNCTION fn_update_system_settings_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_system_settings_update ON system_settings;
CREATE TRIGGER trg_before_system_settings_update
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION fn_update_system_settings_timestamp();
