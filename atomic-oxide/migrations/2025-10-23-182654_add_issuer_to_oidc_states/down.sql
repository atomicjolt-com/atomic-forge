-- Remove issuer column and index from oidc_states
DROP INDEX IF EXISTS idx_oidc_states_issuer;
ALTER TABLE oidc_states DROP COLUMN IF EXISTS issuer;
