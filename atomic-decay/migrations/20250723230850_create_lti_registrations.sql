-- Create LTI registrations table
CREATE TABLE IF NOT EXISTS lti_registrations (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    platform_id INTEGER NOT NULL REFERENCES lti_platforms(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    deployment_id TEXT,
    registration_config JSONB NOT NULL,
    registration_token TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform_id, client_id)
);

-- Create index on platform_id for foreign key lookups
CREATE INDEX idx_lti_registrations_platform_id ON lti_registrations(platform_id);

-- Create index on client_id for faster lookups
CREATE INDEX idx_lti_registrations_client_id ON lti_registrations(client_id);

-- Create update trigger for updated_at
CREATE TRIGGER update_lti_registrations_updated_at BEFORE UPDATE ON lti_registrations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();