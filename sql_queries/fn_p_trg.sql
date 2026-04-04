-- ================================================================
-- REFACTORED DATABASE LOGIC
-- ================================================================
-- This file contains 15 new database objects extracted from
-- repetitive application-level code across the ClickPay backend.
--
-- Safe to run multiple times (uses CREATE OR REPLACE / DROP IF EXISTS).
-- Run AFTER schema_postgresql.sql and database_logic.sql.
-- ================================================================


-- ==========================================
-- 1. FUNCTIONS (5)
-- ==========================================

-- ──────────────────────────────────────────
-- Function 1: fn_get_epin_hash
-- Consolidates the ePin lookup + user existence check
-- repeated in 8+ methods across 4 service files.
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_get_epin_hash(p_user_id BIGINT)
RETURNS VARCHAR AS $$
DECLARE
    v_hash VARCHAR;
BEGIN
    SELECT epin_hash INTO v_hash
    FROM users
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found (ID: %)', p_user_id;
    END IF;

    RETURN v_hash;
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────
-- Function 2: fn_get_system_setting
-- Consolidates the system_settings lookup + fallback default
-- repeated 7 times across transactionService, loanService,
-- savingsService, etc.
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_get_system_setting(
    p_key VARCHAR,
    p_default NUMERIC DEFAULT 0
)
RETURNS NUMERIC AS $$
DECLARE
    v_value NUMERIC;
BEGIN
    SELECT setting_value INTO v_value
    FROM system_settings
    WHERE setting_key = p_key;

    RETURN COALESCE(v_value, p_default);
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────
-- Function 3: fn_get_active_wallet
-- Consolidates the wallet lookup + active status validation
-- repeated in 8+ transactional methods.
-- Returns wallet_id, balance, status for an active wallet.
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_get_active_wallet(
    p_user_id BIGINT,
    p_wallet_type VARCHAR
)
RETURNS TABLE(wallet_id BIGINT, balance NUMERIC, status VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT w.wallet_id, w.balance, w.status::VARCHAR
    FROM wallets w
    WHERE w.user_id = p_user_id
      AND w.wallet_type = p_wallet_type
      AND w.status = 'active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active % wallet not found for user %', p_wallet_type, p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────
-- Function 4: fn_is_duplicate_transaction
-- Consolidates the 30-second duplicate transaction guard
-- used in sendMoney() and cashIn().
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_is_duplicate_transaction(
    p_from_wallet BIGINT,
    p_to_wallet BIGINT,
    p_amount NUMERIC,
    p_window_seconds INT DEFAULT 30
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM transactions
        WHERE from_wallet_id = p_from_wallet
          AND to_wallet_id = p_to_wallet
          AND amount = p_amount
          AND status = 'completed'
          AND created_at > NOW() - (p_window_seconds || ' seconds')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────
-- Function 5: fn_get_receiver_wallet_by_phone
-- Consolidates the phone-to-wallet lookup (JOIN users + wallets)
-- repeated in 5 peer-to-peer transaction methods.
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_get_receiver_wallet_by_phone(p_phone VARCHAR)
RETURNS TABLE(wallet_id BIGINT, user_id BIGINT, status VARCHAR, user_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT w.wallet_id, w.user_id, w.status::VARCHAR, u.name::VARCHAR
    FROM wallets w
    JOIN users u ON w.user_id = u.user_id
    WHERE u.phone = p_phone
      AND w.wallet_type IN ('user', 'agent', 'merchant')
      AND w.status = 'active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active wallet found for phone: %', p_phone;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 2. PROCEDURES (5)
-- ==========================================

-- ──────────────────────────────────────────
-- Procedure 1: p_log_admin_activity
-- Consolidates the admin_activity_logs INSERT
-- repeated in 9 places across 4 service files.
-- ──────────────────────────────────────────
CREATE OR REPLACE PROCEDURE p_log_admin_activity(
    p_admin_id BIGINT,
    p_action_type VARCHAR,
    p_target_id VARCHAR,
    p_description TEXT
)
AS $$
BEGIN
    INSERT INTO admin_activity_logs(admin_user_id, action_type, target_id, description)
    VALUES (p_admin_id, p_action_type, p_target_id, p_description);
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────
-- Procedure 2: p_record_transaction_failure
-- Consolidates the recordFailure() helper function that was
-- identically copy-pasted in transactionService, billService,
-- and loanService (3 copies of 20 lines each).
-- ──────────────────────────────────────────
CREATE OR REPLACE PROCEDURE p_record_transaction_failure(
    p_transaction_id BIGINT,
    p_error_message TEXT
)
AS $$
BEGIN
    IF p_transaction_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE transactions
    SET status = 'failed'
    WHERE transaction_id = p_transaction_id;

    INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
    VALUES (p_transaction_id, 'failed', 'failure', 'Failed: ' || p_error_message);
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────
-- Procedure 3: p_debit_credit_wallets
-- Consolidates the debit-from-sender / credit-to-receiver
-- wallet update pair repeated in 9+ methods across
-- transactionService, loanService, savingsService, agentService.
-- ──────────────────────────────────────────
CREATE OR REPLACE PROCEDURE p_debit_credit_wallets(
    p_from_wallet_id BIGINT,
    p_to_wallet_id BIGINT,
    p_amount NUMERIC
)
AS $$
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be positive. Got: %', p_amount;
    END IF;

    UPDATE wallets SET balance = balance - p_amount WHERE wallet_id = p_from_wallet_id;
    UPDATE wallets SET balance = balance + p_amount WHERE wallet_id = p_to_wallet_id;
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────
-- Procedure 4: p_send_notification
-- Consolidates the INSERT INTO notifications pattern
-- scattered across 6 places in transactionService,
-- fraudDetectionService, and notificationService.
-- ──────────────────────────────────────────
CREATE OR REPLACE PROCEDURE p_send_notification(
    p_user_id BIGINT,
    p_message VARCHAR(500)
)
AS $$
BEGIN
    INSERT INTO notifications(user_id, message)
    VALUES (p_user_id, p_message);
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────
-- Procedure 5: p_set_user_account_status
-- Consolidates the freeze/unfreeze user + all wallets pattern
-- repeated in adminService, fraudDetectionService, loanService.
-- (Enhances the existing p_freeze_user_account to support both
-- freeze and activate operations via a status parameter.)
-- ──────────────────────────────────────────
CREATE OR REPLACE PROCEDURE p_set_user_account_status(
    p_user_id BIGINT,
    p_status VARCHAR  -- 'active' or 'frozen'
)
AS $$
BEGIN
    IF p_status NOT IN ('active', 'frozen') THEN
        RAISE EXCEPTION 'Invalid status: %. Must be active or frozen.', p_status;
    END IF;

    UPDATE users SET status = p_status WHERE user_id = p_user_id;
    UPDATE wallets SET status = p_status WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 3. TRIGGERS (5)
-- ==========================================

-- ──────────────────────────────────────────
-- Trigger 1: Notify Users on Transaction Reversal
-- Automatically sends notifications to both parties
-- when a transaction status changes to 'reversed'.
-- Replaces manual notification inserts in reverseTransaction().
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_notify_on_reversal()
RETURNS TRIGGER AS $$
DECLARE
    v_from_user BIGINT;
    v_to_user BIGINT;
BEGIN
    IF NEW.status = 'reversed' AND OLD.status = 'completed' THEN
        SELECT user_id INTO v_from_user FROM wallets WHERE wallet_id = OLD.from_wallet_id;
        SELECT user_id INTO v_to_user FROM wallets WHERE wallet_id = OLD.to_wallet_id;

        IF v_from_user IS NOT NULL THEN
            INSERT INTO notifications(user_id, message)
            VALUES (v_from_user,
                'A transaction of ৳' || OLD.amount || ' has been reversed. Your wallet has been credited.');
        END IF;

        IF v_to_user IS NOT NULL THEN
            INSERT INTO notifications(user_id, message)
            VALUES (v_to_user,
                'A transaction of ৳' || OLD.amount || ' has been reversed. Your wallet has been debited.');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_on_reversal ON transactions;
CREATE TRIGGER trg_notify_on_reversal
AFTER UPDATE OF status ON transactions
FOR EACH ROW
WHEN (NEW.status = 'reversed')
EXECUTE FUNCTION fn_notify_on_reversal();


-- ──────────────────────────────────────────
-- Trigger 2: Auto-Freeze Wallet on Loan Default
-- When a loan status changes to 'defaulted', automatically
-- freezes the user's wallet. Replaces manual freeze in
-- processLoanDefaults().
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_freeze_wallet_on_loan_default()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'defaulted' AND OLD.status IN ('active', 'overdue') THEN
        UPDATE wallets SET status = 'frozen'
        WHERE user_id = NEW.user_id AND wallet_type = 'user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_freeze_on_loan_default ON loans;
CREATE TRIGGER trg_freeze_on_loan_default
AFTER UPDATE OF status ON loans
FOR EACH ROW
WHEN (NEW.status = 'defaulted')
EXECUTE FUNCTION fn_freeze_wallet_on_loan_default();


-- ──────────────────────────────────────────
-- Trigger 3: Auto-Log Admin Activity on Fraud Alert Resolution
-- When a fraud alert is resolved (frozen/dismissed), automatically
-- inserts an admin activity log. Replaces the identical logging
-- done manually in both freeze and dismiss branches of resolveAlert().
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_log_fraud_resolution()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending'
       AND NEW.status IN ('frozen', 'dismissed')
       AND NEW.resolved_by IS NOT NULL
    THEN
        INSERT INTO admin_activity_logs(admin_user_id, action_type, target_id, description)
        VALUES (
            NEW.resolved_by,
            CASE WHEN NEW.status = 'frozen' THEN 'fraud_freeze' ELSE 'fraud_dismiss' END,
            NEW.flagged_user_id::TEXT,
            'Alert #' || NEW.alert_id || ' ' || NEW.status
                || ' for user ID ' || NEW.flagged_user_id
                || '. Note: ' || COALESCE(NEW.resolution_note, 'N/A')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_fraud_resolution ON fraud_alerts;
CREATE TRIGGER trg_log_fraud_resolution
AFTER UPDATE OF status ON fraud_alerts
FOR EACH ROW
EXECUTE FUNCTION fn_log_fraud_resolution();


-- ──────────────────────────────────────────
-- Trigger 4: Prevent Duplicate Loan Applications
-- Rejects INSERT into loan_applications if the user already
-- has an active/overdue loan or a pending application.
-- Replaces manual check in applyForLoan().
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_validate_loan_application()
RETURNS TRIGGER AS $$
BEGIN
    -- Block if user has an active or overdue loan
    IF EXISTS (
        SELECT 1 FROM loans
        WHERE user_id = NEW.user_id
          AND status IN ('active', 'overdue')
    ) THEN
        RAISE EXCEPTION 'User % already has an active or overdue loan', NEW.user_id;
    END IF;

    -- Block if user has a pending (submitted) application
    IF EXISTS (
        SELECT 1 FROM loan_applications
        WHERE user_id = NEW.user_id
          AND decision_status = 'submitted'
    ) THEN
        RAISE EXCEPTION 'User % already has a pending loan application', NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_loan_application ON loan_applications;
CREATE TRIGGER trg_validate_loan_application
BEFORE INSERT ON loan_applications
FOR EACH ROW
EXECUTE FUNCTION fn_validate_loan_application();


-- ──────────────────────────────────────────
-- Trigger 5: Prevent Duplicate Active Savings Accounts
-- Rejects INSERT into fixed_savings_accounts if the user
-- already has an active savings account.
-- Replaces manual check in createSavingsAccount().
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_prevent_duplicate_savings()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM fixed_savings_accounts
        WHERE user_id = NEW.user_id
          AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'User % already has an active savings account', NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_savings ON fixed_savings_accounts;
CREATE TRIGGER trg_prevent_duplicate_savings
BEFORE INSERT ON fixed_savings_accounts
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_duplicate_savings();


-- ================================================================
-- END OF REFACTORED LOGIC
-- ================================================================
-- To execute: psql -U your_user -d your_db -f refactored_logic.sql
-- Or paste the contents into your Supabase SQL Editor.
-- ================================================================
