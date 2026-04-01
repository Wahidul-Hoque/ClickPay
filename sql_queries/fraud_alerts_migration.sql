-- FRAUD_ALERTS TABLE
-- Stores flagged suspicious transaction patterns
CREATE TABLE IF NOT EXISTS fraud_alerts (
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

-- Index for fast lookups by status and user
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user ON fraud_alerts(flagged_user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_created ON fraud_alerts(created_at DESC);
