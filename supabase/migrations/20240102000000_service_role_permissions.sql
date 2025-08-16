-- Grant service_role access to bottle_collection schema and tables
-- This allows sync scripts to work with the custom schema

-- Grant usage on schema to service_role
GRANT USAGE ON SCHEMA bottle_collection TO service_role;

-- Grant all privileges on existing tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA bottle_collection TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA bottle_collection TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA bottle_collection TO service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA bottle_collection GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA bottle_collection GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA bottle_collection GRANT ALL ON FUNCTIONS TO service_role;

-- Specifically grant permissions on our tables
GRANT ALL PRIVILEGES ON bottle_collection.supermarkets TO service_role;
GRANT ALL PRIVILEGES ON bottle_collection.supermarket_incidents TO service_role;
GRANT ALL PRIVILEGES ON bottle_collection.sync_metadata TO service_role;