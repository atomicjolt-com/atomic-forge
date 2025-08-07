-- Add nonce column to oidc_states table
ALTER TABLE oidc_states ADD COLUMN IF NOT EXISTS nonce VARCHAR NOT NULL DEFAULT '';