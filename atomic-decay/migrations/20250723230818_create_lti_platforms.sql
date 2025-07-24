-- Create LTI platforms table
CREATE TABLE IF NOT EXISTS lti_platforms (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    issuer TEXT NOT NULL UNIQUE,
    name TEXT,
    jwks_url TEXT NOT NULL,
    token_url TEXT NOT NULL,
    oidc_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on issuer for faster lookups
CREATE INDEX idx_lti_platforms_issuer ON lti_platforms(issuer);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lti_platforms_updated_at BEFORE UPDATE ON lti_platforms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
