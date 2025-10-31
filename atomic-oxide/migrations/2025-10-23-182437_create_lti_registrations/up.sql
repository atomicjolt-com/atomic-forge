-- Create LTI registrations table
CREATE TABLE lti_registrations (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR NOT NULL DEFAULT gen_random_uuid()::VARCHAR,
    platform_id BIGINT NOT NULL REFERENCES lti_platforms(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    deployment_id TEXT,
    registration_config JSONB NOT NULL,
    registration_token TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    supported_placements JSONB,
    supported_message_types JSONB,
    capabilities JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform_id, client_id)
);

-- Create indexes
CREATE INDEX idx_lti_registrations_platform_id ON lti_registrations(platform_id);
CREATE INDEX idx_lti_registrations_client_id ON lti_registrations(client_id);

-- Create indexes for JSONB fields to improve query performance
CREATE INDEX idx_lti_registrations_supported_placements ON lti_registrations USING GIN (supported_placements);
CREATE INDEX idx_lti_registrations_supported_message_types ON lti_registrations USING GIN (supported_message_types);
CREATE INDEX idx_lti_registrations_capabilities ON lti_registrations USING GIN (capabilities);

-- Apply trigger for updated_at (reuse the function created in lti_platforms migration)
CREATE TRIGGER update_lti_registrations_updated_at BEFORE UPDATE ON lti_registrations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
