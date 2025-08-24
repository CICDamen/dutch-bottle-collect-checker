-- Row Level Security and Permissions Setup
-- Secure access control for all tables with proper service role permissions

-- First, ensure RLS is enabled on all tables
ALTER TABLE public.supermarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supermarket_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start clean
DROP POLICY IF EXISTS "Public can view supermarkets" ON public.supermarkets;
DROP POLICY IF EXISTS "Admins can manage supermarkets" ON public.supermarkets;
DROP POLICY IF EXISTS "Service role can manage supermarkets" ON public.supermarkets;

DROP POLICY IF EXISTS "Public can create incidents" ON public.supermarket_incidents;
DROP POLICY IF EXISTS "Public can view incidents" ON public.supermarket_incidents;
DROP POLICY IF EXISTS "Admins can manage incidents" ON public.supermarket_incidents;
DROP POLICY IF EXISTS "Service role can manage incidents" ON public.supermarket_incidents;

DROP POLICY IF EXISTS "Public can view sync metadata" ON public.sync_metadata;
DROP POLICY IF EXISTS "Admins can manage sync metadata" ON public.sync_metadata;
DROP POLICY IF EXISTS "Service role can manage sync metadata" ON public.sync_metadata;

-- ===========================================
-- SUPERMARKETS TABLE POLICIES
-- ===========================================

-- Public read access to supermarkets
CREATE POLICY "Public can view supermarkets" ON public.supermarkets
  FOR SELECT USING (true);

-- Service role full access (for sync operations)
-- Note: For self-hosted setups where anon key = service key, this allows anon role to manage data
CREATE POLICY "Service role can manage supermarkets" ON public.supermarkets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon/Service role can manage supermarkets" ON public.supermarkets
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Admin full access (authenticated users with admin role)
CREATE POLICY "Admins can manage supermarkets" ON public.supermarkets
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
  ) WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
  );

-- ===========================================
-- SUPERMARKET INCIDENTS TABLE POLICIES
-- ===========================================

-- Public read access to incidents
CREATE POLICY "Public can view incidents" ON public.supermarket_incidents
  FOR SELECT USING (true);

-- Public can create incidents (for reporting)
CREATE POLICY "Public can create incidents" ON public.supermarket_incidents
  FOR INSERT WITH CHECK (true);

-- Service role full access (for sync operations and admin functions)
-- Note: For self-hosted setups where anon key = service key, this allows anon role to manage data
CREATE POLICY "Service role can manage incidents" ON public.supermarket_incidents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon/Service role can manage incidents" ON public.supermarket_incidents
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Admin full access (authenticated users with admin role)
CREATE POLICY "Admins can manage incidents" ON public.supermarket_incidents
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
  ) WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
  );

-- ===========================================
-- SYNC METADATA TABLE POLICIES
-- ===========================================

-- Public read access to sync metadata
CREATE POLICY "Public can view sync metadata" ON public.sync_metadata
  FOR SELECT USING (true);

-- Service role full access (for sync operations)
-- Note: For self-hosted setups where anon key = service key, this allows anon role to manage data
CREATE POLICY "Service role can manage sync metadata" ON public.sync_metadata
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anon/Service role can manage sync metadata" ON public.sync_metadata
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Admin full access (authenticated users with admin role)
CREATE POLICY "Admins can manage sync metadata" ON public.sync_metadata
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
  ) WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
  );

-- ===========================================
-- SERVICE ROLE PERMISSIONS
-- ===========================================

-- Grant full schema access to service_role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- Specifically grant permissions on our tables (redundant but explicit)
GRANT ALL PRIVILEGES ON public.supermarkets TO service_role;
GRANT ALL PRIVILEGES ON public.supermarket_incidents TO service_role;
GRANT ALL PRIVILEGES ON public.sync_metadata TO service_role;

-- Grant access to the view
GRANT SELECT ON public.supermarket_incident_summary TO service_role, anon, authenticated;

-- ===========================================
-- PUBLIC ACCESS PERMISSIONS
-- ===========================================

-- Grant necessary permissions to anon (public) role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.supermarkets TO anon;
GRANT SELECT ON public.supermarket_incidents TO anon;
GRANT INSERT ON public.supermarket_incidents TO anon;  -- For incident reporting
GRANT SELECT ON public.sync_metadata TO anon;
GRANT SELECT ON public.supermarket_incident_summary TO anon;

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.supermarkets TO authenticated;
GRANT SELECT ON public.supermarket_incidents TO authenticated;
GRANT INSERT ON public.supermarket_incidents TO authenticated;  -- For incident reporting
GRANT SELECT ON public.sync_metadata TO authenticated;
GRANT SELECT ON public.supermarket_incident_summary TO authenticated;

-- Admins get additional permissions (handled by RLS policies above)
-- Service role gets full permissions (handled by RLS policies above)

-- ===========================================
-- SEQUENCE PERMISSIONS
-- ===========================================

-- Grant sequence usage for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ===========================================
-- FUNCTION PERMISSIONS
-- ===========================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION bulk_resolve_incidents(UUID[], TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO service_role;
GRANT EXECUTE ON FUNCTION update_sync_metadata_timestamp() TO service_role;