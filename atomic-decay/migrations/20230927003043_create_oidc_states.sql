-- Create oidc_states table
CREATE TABLE oidc_states (
  id BIGSERIAL PRIMARY KEY,
  state VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);