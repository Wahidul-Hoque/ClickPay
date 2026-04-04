-- USERS
CREATE TABLE users (
  user_id     BIGSERIAL PRIMARY KEY,
  name        VARCHAR(150),
  phone       VARCHAR(30)  NOT NULL UNIQUE,
  nid         VARCHAR(50)  NOT NULL UNIQUE,
  epin_hash   VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL CHECK (role IN ('user','agent','admin','merchant')),
  status      VARCHAR(30)  NOT NULL,
  city        VARCHAR(100),
  email       VARCHAR(255) UNIQUE,
  reset_otp   VARCHAR(6),
  reset_otp_expiry TIMESTAMP,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- WALLETS
CREATE TABLE wallets (
  wallet_id      BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(user_id),
  wallet_type    VARCHAR(20) NOT NULL CHECK (wallet_type IN ('user', 'agent', 'system', 'merchant', 'user_savings')),
  system_purpose VARCHAR(50),
  balance        NUMERIC(18,2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
  status         VARCHAR(20) NOT NULL CHECK (status IN ('active','frozen','closed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_wallets_system_purpose CHECK (
    (wallet_type = 'system' AND system_purpose IS NOT NULL)
    OR
    (wallet_type <> 'system' AND system_purpose IS NULL)
  )
);


CREATE TABLE transactions (
  transaction_id    BIGSERIAL PRIMARY KEY,
  from_wallet_id    BIGINT  REFERENCES wallets(wallet_id),
  from_bank_account_id BIGINT REFERENCES mock_bank_accounts(account_id),
  from_card_account_id BIGINT REFERENCES mock_card_accounts(card_id),
  to_wallet_id      BIGINT NOT NULL REFERENCES wallets(wallet_id),
  amount            NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  transaction_type  VARCHAR(30) NOT NULL,
  status            VARCHAR(20) NOT NULL CHECK (status IN ('initiated','pending','on_hold','completed','failed')),
  reference         VARCHAR(150),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions
ADD CONSTRAINT check_transaction_source_logic
CHECK (
  (transaction_type = 'bank_transfer' AND from_bank_account_id IS NOT NULL AND from_wallet_id IS NULL AND from_card_account_id IS NULL)
  OR 
  (transaction_type = 'card_transfer' AND from_card_account_id IS NOT NULL AND from_wallet_id IS NULL AND from_bank_account_id IS NULL)
  OR
  (transaction_type NOT IN ('bank_transfer', 'card_transfer') AND from_wallet_id IS NOT NULL AND from_bank_account_id IS NULL AND from_card_account_id IS NULL)
);

-- TRANSACTION_EVENTS
CREATE TABLE transaction_events (
  event_id        BIGSERIAL PRIMARY KEY,
  transaction_id  BIGINT NOT NULL REFERENCES transactions(transaction_id),
  event_type      VARCHAR(30) NOT NULL,
  event_status    VARCHAR(20) NOT NULL CHECK (event_status IN ('success','failure','info')),
  details         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- COMPLIANCE_CHECKS
CREATE TABLE compliance_checks (
  check_id        BIGSERIAL PRIMARY KEY,
  transaction_id  BIGINT NOT NULL REFERENCES transactions(transaction_id),
  check_type      VARCHAR(10) NOT NULL CHECK (check_type IN ('KYC','AML')),
  status          VARCHAR(20) NOT NULL CHECK (status IN ('pending','passed','failed','review')),
  provider        VARCHAR(60),
  details         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AGENT_FEES
CREATE TABLE agent_fees (
  fee_id                  BIGSERIAL PRIMARY KEY,
  cashout_transaction_id  BIGINT NOT NULL REFERENCES transactions(transaction_id),
  agent_wallet_id         BIGINT NOT NULL REFERENCES wallets(wallet_id),
  fee_amount              NUMERIC(18,2) NOT NULL CHECK (fee_amount >= 0),
  payout_transaction_id   BIGINT REFERENCES transactions(transaction_id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. The actual "Add Money" / Top-up Transaction
CREATE TABLE external_topups (
  topup_id            BIGSERIAL PRIMARY KEY,
  wallet_id           BIGINT NOT NULL REFERENCES wallets(wallet_id),
  method_id           BIGINT NOT NULL REFERENCES user_payment_methods(method_id),
  amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  status              VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id      BIGINT REFERENCES transactions(transaction_id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- BILLERS
CREATE TABLE billers (
  biller_id  BIGSERIAL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  category   VARCHAR(40) NOT NULL,
  status     VARCHAR(20) NOT NULL CHECK (status IN ('active','inactive'))
);

-- BILL_PAYMENTS
CREATE TABLE bill_payments (
  bill_payment_id     BIGSERIAL PRIMARY KEY,
  wallet_id           BIGINT NOT NULL REFERENCES wallets(wallet_id),
  biller_id           BIGINT NOT NULL REFERENCES billers(biller_id),
  transaction_id      BIGINT REFERENCES transactions(transaction_id),
  amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  provider_reference  VARCHAR(150),
  status              VARCHAR(20) NOT NULL CHECK (status IN ('initiated','pending','completed','failed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- MONEY_REQUESTS
CREATE TABLE money_requests (
  request_id            BIGSERIAL PRIMARY KEY,
  requester_user_id     BIGINT NOT NULL REFERENCES users(user_id),
  requester_wallet_id   BIGINT NOT NULL REFERENCES wallets(wallet_id),
  requestee_user_id     BIGINT NOT NULL REFERENCES users(user_id),
  requestee_wallet_id   BIGINT NOT NULL REFERENCES wallets(wallet_id),
  amount                NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  message               VARCHAR(250),
  expires_at            TIMESTAMPTZ,
  status                VARCHAR(20) NOT NULL CHECK (status IN ('requested','declined','cancelled','expired','paid')),
  paid_transaction_id   BIGINT REFERENCES transactions(transaction_id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FIXED_SAVINGS_ACCOUNTS
CREATE TABLE fixed_savings_accounts (
  fixed_savings_id       BIGSERIAL PRIMARY KEY,
  user_id                BIGINT NOT NULL REFERENCES users(user_id),
  funding_wallet_id      BIGINT NOT NULL REFERENCES wallets(wallet_id),
  savings_wallet_id      BIGINT NOT NULL REFERENCES wallets(wallet_id),
  principal_amount       NUMERIC(18,2) NOT NULL CHECK (principal_amount > 0),
  annual_interest_rate   NUMERIC(6,5) NOT NULL CHECK (annual_interest_rate >= 0),
  start_at               TIMESTAMPTZ NOT NULL,
  status                 VARCHAR(20) NOT NULL CHECK (status IN ('active','broken','closed')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LOAN_APPLICATIONS
CREATE TABLE loan_applications (
  application_id     BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL REFERENCES users(user_id),
  requested_amount   NUMERIC(18,2) NOT NULL CHECK (requested_amount > 0),
  interest_rate      NUMERIC(6,5) NOT NULL CHECK (interest_rate >= 0),
  term_days          INTEGER NOT NULL CHECK (term_days > 0),
  decision_status    VARCHAR(20) NOT NULL CHECK (decision_status IN ('submitted','approved','rejected')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LOANS
CREATE TABLE loans (
  loan_id                      BIGSERIAL PRIMARY KEY,
  application_id               BIGINT NOT NULL REFERENCES loan_applications(application_id),
  user_id                      BIGINT NOT NULL REFERENCES users(user_id),
  principal_amount             NUMERIC(18,2) NOT NULL CHECK (principal_amount > 0),
  interest_rate                NUMERIC(6,5) NOT NULL CHECK (interest_rate >= 0),
  disbursed_at                 TIMESTAMPTZ,
  due_at                       TIMESTAMPTZ,
  disbursement_transaction_id  BIGINT REFERENCES transactions(transaction_id),
  repayment_transaction_id     BIGINT REFERENCES transactions(transaction_id),
  status                       VARCHAR(20) NOT NULL CHECK (status IN ('active','repaid','overdue','defaulted')),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  subscription_id       BIGSERIAL PRIMARY KEY,
  subscriber_user_id    BIGINT NOT NULL REFERENCES users(user_id),
  subscriber_wallet_id  BIGINT NOT NULL REFERENCES wallets(wallet_id),
  merchant_user_id      BIGINT REFERENCES users(user_id),
  merchant_wallet_id    BIGINT NOT NULL REFERENCES wallets(wallet_id),
  plan_name             VARCHAR(100),
  amount                NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  start_at              TIMESTAMPTZ NOT NULL,
  next_billing_at       TIMESTAMPTZ NOT NULL,
  end_at                TIMESTAMPTZ,
  auto_renew            BOOLEAN NOT NULL,
  status                VARCHAR(20) NOT NULL CHECK (status IN ('active','paused','cancelled','expired')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MERCHANT_PROFILES
CREATE TABLE merchant_profiles (
  merchant_user_id  BIGINT PRIMARY KEY REFERENCES users(user_id),
  merchant_name     VARCHAR(150) NOT NULL,
  business_type     VARCHAR(60),
  category          VARCHAR(60),
  status            VARCHAR(20) NOT NULL CHECK (status IN ('active','suspended')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  notification_id  BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(user_id),
  message          VARCHAR(500) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ADMIN_ACTIVITY_LOGS (Feature #12)
CREATE TABLE admin_activity_logs (
  log_id          BIGSERIAL PRIMARY KEY,
  admin_user_id   BIGINT NOT NULL REFERENCES users(user_id),
  action_type     VARCHAR(50) NOT NULL, -- e.g., 'user_freeze', 'rate_change', 'loan_approve'
  target_id       VARCHAR(50),          -- ID of the user or record modified
  description     TEXT,                 -- Detailed explanation of the change
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--  Create Master Banks Table
CREATE TABLE banks (
  bank_id    SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE
);

--  Create Master Card Networks Table
CREATE TABLE card_networks (
  network_id SERIAL PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE
);

-- 1. Simulated Database of a Real Bank
CREATE TABLE mock_bank_accounts (
  account_id          SERIAL PRIMARY KEY,
  bank_id             INTEGER NOT NULL REFERENCES banks(bank_id),
  account_holder_name VARCHAR(150) NOT NULL,
  phone_number        VARCHAR(30) NOT NULL, -- User will enter this to "Link"
  bank_pin            VARCHAR(10) NOT NULL, -- User will enter this to "Link"
  current_balance     NUMERIC(18,2) NOT NULL DEFAULT 10000.00 CHECK (current_balance >= 0),
  UNIQUE(bank_id, phone_number) -- One phone number per bank
);

-- 2. (Optional) Create a similar one for Cards if you want
CREATE TABLE mock_card_accounts (
  card_id             SERIAL PRIMARY KEY,
  network_id          INTEGER NOT NULL REFERENCES card_networks(network_id),
  card_number         VARCHAR(19) NOT NULL UNIQUE, -- User enters this
  expiry_date         VARCHAR(5) NOT NULL, -- MM/YY
  cvv                 VARCHAR(3) NOT NULL, --card verification value
  current_balance     NUMERIC(18,2) NOT NULL DEFAULT 5000.00 CHECK (current_balance >= 0)
);


-- 3. Which User has "Linked" which Mock Account to their MFS profile
CREATE TABLE user_payment_methods (
  method_id          BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL REFERENCES users(user_id),
  method_type        VARCHAR(10) NOT NULL CHECK (method_type IN ('bank', 'card')),
  
  -- Link to either a mock bank or a mock card
  mock_bank_account_id INTEGER REFERENCES mock_bank_accounts(account_id),
  mock_card_account_id INTEGER REFERENCES mock_card_accounts(card_id),
  
  status             VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at         TIMESTAMPTZ DEFAULT NOW(),

  -- Logic: ensure it's linked to exactly one mock record
  CONSTRAINT chk_link_source CHECK (
    (method_type = 'bank' AND mock_bank_account_id IS NOT NULL) OR
    (method_type = 'card' AND mock_card_account_id IS NOT NULL)
  ),
  -- Prevent linking the same account twice to the same user
  UNIQUE(user_id, mock_bank_account_id),
  UNIQUE(user_id, mock_card_account_id)
);

-- FAVORITES
CREATE TABLE favorites (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL REFERENCES users(user_id),
  type                VARCHAR(20) NOT NULL CHECK (type IN ('number','agent')),
  name                VARCHAR(150) NOT NULL,
  phone               VARCHAR(30) NOT NULL,
  is_favorite         BOOLEAN DEFAULT FALSE,
  marked_favorite_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, phone, type)
);

-- SYSTEM SETTINGS
CREATE TABLE system_settings (
    setting_key     VARCHAR(100) PRIMARY KEY,
    setting_value   NUMERIC(15,2) NOT NULL,
    description      TEXT,
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('daily_send_money_limit', 25000.00, 'Max amount a user can send per day via transfer'),
('monthly_send_money_limit', 100000.00, 'Max amount a user can send per month via transfer'),
('daily_receive_money_limit', 50000.00, 'Max amount a user can receive per day'),
('monthly_receive_money_limit', 200000.00, 'Max amount a user can receive per month'),
('daily_mobile_recharge_limit', 10000.00, 'Max amount heavily rechargable per day'),
('monthly_mobile_recharge_limit', 50000.00, 'Max amount heavily rechargable per month')
ON CONFLICT (setting_key) DO NOTHING;


-- FRAUD_ALERTS
CREATE TABLE fraud_alerts (
  alert_id          BIGSERIAL PRIMARY KEY,
  flagged_user_id   BIGINT NOT NULL REFERENCES users(user_id),
  from_wallet_id    BIGINT NOT NULL REFERENCES wallets(wallet_id),
  to_wallet_id      BIGINT NOT NULL REFERENCES wallets(wallet_id),
  amount            NUMERIC(18,2) NOT NULL,
  transaction_type  VARCHAR(30) NOT NULL,
  repeat_count      INTEGER NOT NULL,
  description       TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'reviewed', 'frozen', 'dismissed')),
  resolved_by       BIGINT REFERENCES users(user_id),
  resolved_at       TIMESTAMPTZ,
  resolution_note   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_user ON fraud_alerts(flagged_user_id);
CREATE INDEX idx_fraud_alerts_created ON fraud_alerts(created_at DESC);
