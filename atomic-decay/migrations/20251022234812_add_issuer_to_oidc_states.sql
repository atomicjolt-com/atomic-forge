-- Add issuer column to oidc_states for tracking registration context
ALTER TABLE oidc_states
ADD COLUMN IF NOT EXISTS issuer TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oidc_states_issuer ON oidc_states(issuer);
