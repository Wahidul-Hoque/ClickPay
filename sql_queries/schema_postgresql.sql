-- USERS
CREATE TABLE users (
  user_id     BIGSERIAL PRIMARY KEY,
  name        VARCHAR(150),
  phone       VARCHAR(30)  NOT NULL UNIQUE,
  nid         VARCHAR(50)  NOT NULL UNIQUE,
  epin_hash   VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL CHECK (role IN ('user','agent','admin')),
  status      VARCHAR(30)  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- WALLETS
CREATE TABLE wallets (
  wallet_id      BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(user_id),
  wallet_type    VARCHAR(20) NOT NULL CHECK (wallet_type IN ('user','agent','system')),
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

-- PAYMENT_METHODS
CREATE TABLE payment_methods (
  payment_method_id  BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL REFERENCES users(user_id),
  type               VARCHAR(20) NOT NULL CHECK (type IN ('bank','card')),
  provider           VARCHAR(60) NOT NULL,
  masked_identifier  VARCHAR(100) NOT NULL,
  token              VARCHAR(255) NOT NULL,
  status             VARCHAR(20) NOT NULL CHECK (status IN ('active','disabled')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE transactions (
  transaction_id    BIGSERIAL PRIMARY KEY,
  from_wallet_id    BIGINT NOT NULL REFERENCES wallets(wallet_id),
  to_wallet_id      BIGINT NOT NULL REFERENCES wallets(wallet_id),
  amount            NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  transaction_type  VARCHAR(30) NOT NULL,
  status            VARCHAR(20) NOT NULL CHECK (status IN ('initiated','pending','on_hold','completed','failed')),
  reference         VARCHAR(150),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- EXTERNAL_TOPUPS
CREATE TABLE external_topups (
  topup_id            BIGSERIAL PRIMARY KEY,
  wallet_id           BIGINT NOT NULL REFERENCES wallets(wallet_id),
  payment_method_id   BIGINT NOT NULL REFERENCES payment_methods(payment_method_id),
  transaction_id      BIGINT REFERENCES transactions(transaction_id),
  amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  provider_reference  VARCHAR(150),
  status              VARCHAR(20) NOT NULL CHECK (status IN ('initiated','pending','verified','completed','failed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- QR_CODES
CREATE TABLE qr_codes (
  qr_code_id       BIGSERIAL PRIMARY KEY,
  owner_user_id    BIGINT NOT NULL REFERENCES users(user_id),
  owner_wallet_id  BIGINT NOT NULL REFERENCES wallets(wallet_id),
  qr_type          VARCHAR(20) NOT NULL CHECK (qr_type IN ('static','dynamic')),
  payload          VARCHAR(300) NOT NULL UNIQUE,
  fixed_amount     NUMERIC(18,2) CHECK (fixed_amount IS NULL OR fixed_amount > 0),
  note             VARCHAR(200),
  expires_at       TIMESTAMPTZ,
  status           VARCHAR(20) NOT NULL CHECK (status IN ('active','expired','revoked')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
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