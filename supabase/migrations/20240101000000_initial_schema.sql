-- Supabase SQL Schema for Dutch Bottle Check App
-- Complete schema with supermarkets, incidents, and admin functionality

-- Create bottle_collection schema for application-specific tables
CREATE SCHEMA IF NOT EXISTS bottle_collection;

-- Grant usage on schema to authenticated users and anon
GRANT USAGE ON SCHEMA bottle_collection TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA bottle_collection TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA bottle_collection TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA bottle_collection TO authenticated, anon;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA bottle_collection GRANT ALL ON TABLES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA bottle_collection GRANT ALL ON SEQUENCES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA bottle_collection GRANT ALL ON FUNCTIONS TO authenticated, anon;

-- Create supermarkets table
CREATE TABLE IF NOT EXISTS bottle_collection.supermarkets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chain TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    google_place_id TEXT,
    opening_hours JSONB,
    status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'closed',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supermarket incidents table for incident reporting and management
CREATE TABLE IF NOT EXISTS bottle_collection.supermarket_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supermarket_id UUID NOT NULL REFERENCES bottle_collection.supermarkets(id) ON DELETE CASCADE,
    incident_type TEXT NOT NULL CHECK (incident_type IN (
        'machine_broken', 
        'machine_full', 
        'no_receipt', 
        'wrong_amount', 
        'other'
    )),
    description TEXT,
    reporter_email TEXT,
    reporter_name TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync_metadata table for tracking data sync operations
CREATE TABLE IF NOT EXISTS bottle_collection.sync_metadata (
    id INTEGER DEFAULT 1 PRIMARY KEY,
    last_sync TIMESTAMPTZ,
    total_locations INTEGER,
    status TEXT,
    error_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial sync metadata record
INSERT INTO bottle_collection.sync_metadata (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
-- Supermarkets indexes
CREATE INDEX IF NOT EXISTS idx_supermarkets_location ON bottle_collection.supermarkets (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_supermarkets_status ON bottle_collection.supermarkets (status);
CREATE INDEX IF NOT EXISTS idx_supermarkets_city ON bottle_collection.supermarkets (city);
CREATE INDEX IF NOT EXISTS idx_supermarkets_postal_code ON bottle_collection.supermarkets (postal_code);
CREATE INDEX IF NOT EXISTS idx_supermarkets_chain ON bottle_collection.supermarkets (chain);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supermarkets_google_place_id ON bottle_collection.supermarkets (google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supermarkets_opening_hours ON bottle_collection.supermarkets USING GIN (opening_hours);

-- Incidents indexes
CREATE INDEX IF NOT EXISTS idx_incidents_supermarket ON bottle_collection.supermarket_incidents (supermarket_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON bottle_collection.supermarket_incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON bottle_collection.supermarket_incidents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON bottle_collection.supermarket_incidents (priority);

-- Enable Row Level Security (RLS)
ALTER TABLE bottle_collection.supermarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_collection.supermarket_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_collection.sync_metadata ENABLE ROW LEVEL SECURITY;

-- Create security policies

-- Supermarkets: Public read access, admin-only write access
CREATE POLICY "Public can view supermarkets" ON bottle_collection.supermarkets
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage supermarkets" ON bottle_collection.supermarkets
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
  );

-- Incidents: Public can create and view, admins can manage
CREATE POLICY "Public can create incidents" ON bottle_collection.supermarket_incidents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view incidents" ON bottle_collection.supermarket_incidents
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage incidents" ON bottle_collection.supermarket_incidents
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
  );

-- Sync metadata: Public read access, admin-only write access
CREATE POLICY "Public can view sync metadata" ON bottle_collection.sync_metadata
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sync metadata" ON bottle_collection.sync_metadata
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
  );

-- Function to update last_updated timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update timestamps
CREATE TRIGGER update_supermarkets_updated_at
    BEFORE UPDATE ON bottle_collection.supermarkets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON bottle_collection.supermarket_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update sync metadata timestamp
CREATE OR REPLACE FUNCTION update_sync_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for sync metadata
CREATE TRIGGER update_sync_metadata_updated_at
    BEFORE UPDATE ON bottle_collection.sync_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_sync_metadata_timestamp();

-- Create view for incident summaries per supermarket
CREATE OR REPLACE VIEW bottle_collection.supermarket_incident_summary AS
SELECT 
    s.id as supermarket_id,
    s.name as supermarket_name,
    s.chain,
    s.city,
    COUNT(CASE WHEN si.status IN ('open', 'investigating') THEN 1 END) as active_incidents,
    COUNT(si.id) as total_incidents,
    STRING_AGG(
        CASE WHEN si.status IN ('open', 'investigating') 
        THEN si.incident_type 
        END, ', '
    ) as active_incident_types,
    MAX(CASE WHEN si.status IN ('open', 'investigating') THEN si.created_at END) as last_incident_date
FROM bottle_collection.supermarkets s
LEFT JOIN bottle_collection.supermarket_incidents si ON s.id = si.supermarket_id
GROUP BY s.id, s.name, s.chain, s.city
ORDER BY active_incidents DESC, s.name;

-- Admin-only function to get dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
    total_supermarkets BIGINT,
    total_incidents BIGINT,
    active_incidents BIGINT,
    resolved_incidents BIGINT
) 
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has admin role
    IF NOT (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM bottle_collection.supermarkets)::BIGINT as total_supermarkets,
        (SELECT COUNT(*) FROM bottle_collection.supermarket_incidents)::BIGINT as total_incidents,
        (SELECT COUNT(*) FROM bottle_collection.supermarket_incidents WHERE status IN ('open', 'investigating'))::BIGINT as active_incidents,
        (SELECT COUNT(*) FROM bottle_collection.supermarket_incidents WHERE status IN ('resolved', 'closed'))::BIGINT as resolved_incidents;
END;
$$ LANGUAGE plpgsql;

-- Admin-only function to bulk resolve incidents
CREATE OR REPLACE FUNCTION bulk_resolve_incidents(
    incident_ids UUID[],
    admin_note TEXT DEFAULT NULL
)
RETURNS INTEGER
SECURITY DEFINER
AS $$
DECLARE
    resolved_count INTEGER;
BEGIN
    -- Check if user has admin role
    IF NOT (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'supermarket_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Update incidents to resolved status
    UPDATE bottle_collection.supermarket_incidents 
    SET 
        status = 'resolved',
        admin_notes = COALESCE(admin_note, admin_notes),
        updated_at = NOW()
    WHERE id = ANY(incident_ids)
    AND status != 'resolved';
    
    GET DIAGNOSTICS resolved_count = ROW_COUNT;
    
    RETURN resolved_count;
END;
$$ LANGUAGE plpgsql;

-- Add column comments for documentation
COMMENT ON TABLE bottle_collection.supermarket_incidents IS 'Incident reports for supermarket bottle return systems';
COMMENT ON COLUMN bottle_collection.supermarkets.google_place_id IS 'Google Places API Place ID for tracking and deduplication during sync operations';
COMMENT ON COLUMN bottle_collection.supermarkets.opening_hours IS 'JSON object containing opening hours for each day of the week';
COMMENT ON COLUMN bottle_collection.supermarkets.created_at IS 'Timestamp when the record was first created';
COMMENT ON COLUMN bottle_collection.supermarkets.last_updated IS 'Timestamp when the record was last updated (automatically maintained)';
COMMENT ON COLUMN bottle_collection.supermarket_incidents.incident_type IS 'Type of incident reported';
COMMENT ON COLUMN bottle_collection.supermarket_incidents.priority IS 'Priority level set by admin';
COMMENT ON COLUMN bottle_collection.supermarket_incidents.status IS 'Current status of the incident';
COMMENT ON COLUMN bottle_collection.supermarket_incidents.admin_notes IS 'Internal notes added by administrators';