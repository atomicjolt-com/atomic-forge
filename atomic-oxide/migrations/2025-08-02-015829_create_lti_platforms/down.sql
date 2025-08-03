-- Drop trigger and function
DROP TRIGGER IF EXISTS update_lti_platforms_updated_at ON lti_platforms;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop index
DROP INDEX IF EXISTS idx_lti_platforms_issuer;

-- Drop table
DROP TABLE IF EXISTS lti_platforms;