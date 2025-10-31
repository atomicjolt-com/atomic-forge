-- Add JSONB fields for placements, message types, and capabilities to lti_registrations
ALTER TABLE lti_registrations
ADD COLUMN IF NOT EXISTS supported_placements JSONB,
ADD COLUMN IF NOT EXISTS supported_message_types JSONB,
ADD COLUMN IF NOT EXISTS capabilities JSONB;

-- Add indexes for JSONB fields to improve query performance
CREATE INDEX IF NOT EXISTS idx_lti_registrations_supported_placements ON lti_registrations USING GIN (supported_placements);
CREATE INDEX IF NOT EXISTS idx_lti_registrations_supported_message_types ON lti_registrations USING GIN (supported_message_types);
CREATE INDEX IF NOT EXISTS idx_lti_registrations_capabilities ON lti_registrations USING GIN (capabilities);
