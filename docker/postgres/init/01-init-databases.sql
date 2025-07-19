-- Initialize databases for each project in the monorepo
-- This script runs when the container starts for the first time

-- Create databases for each project
CREATE DATABASE atomic_oxide_dev;
CREATE DATABASE atomic_oxide_test;

CREATE DATABASE atomic_lti_dev;
CREATE DATABASE atomic_lti_test;

CREATE DATABASE atomic_decay_dev;
CREATE DATABASE atomic_decay_test;

-- Create a shared user for all projects (optional)
CREATE USER atomic_user WITH PASSWORD 'atomic_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE atomic_oxide_dev TO atomic_user;
GRANT ALL PRIVILEGES ON DATABASE atomic_oxide_test TO atomic_user;
GRANT ALL PRIVILEGES ON DATABASE atomic_lti_dev TO atomic_user;
GRANT ALL PRIVILEGES ON DATABASE atomic_lti_test TO atomic_user;
GRANT ALL PRIVILEGES ON DATABASE atomic_decay_dev TO atomic_user;
GRANT ALL PRIVILEGES ON DATABASE atomic_decay_test TO atomic_user;

-- Grant schema permissions
\c atomic_oxide_dev;
GRANT ALL ON SCHEMA public TO atomic_user;
\c atomic_oxide_test;
GRANT ALL ON SCHEMA public TO atomic_user;
\c atomic_lti_dev;
GRANT ALL ON SCHEMA public TO atomic_user;
\c atomic_lti_test;
GRANT ALL ON SCHEMA public TO atomic_user;
\c atomic_decay_dev;
GRANT ALL ON SCHEMA public TO atomic_user;
\c atomic_decay_test;
GRANT ALL ON SCHEMA public TO atomic_user;