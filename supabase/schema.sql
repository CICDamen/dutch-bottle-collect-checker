-- Supermarkets table
CREATE TABLE IF NOT EXISTS public.supermarkets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    chain TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed', 'unknown')) DEFAULT 'unknown',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync metadata table
CREATE TABLE IF NOT EXISTS public.sync_metadata (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_sync TIMESTAMPTZ,
    total_locations INTEGER,
    status TEXT CHECK (status IN ('success', 'error', 'running')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_supermarkets_chain ON public.supermarkets(chain);
CREATE INDEX IF NOT EXISTS idx_supermarkets_city ON public.supermarkets(city);
CREATE INDEX IF NOT EXISTS idx_supermarkets_status ON public.supermarkets(status);
CREATE INDEX IF NOT EXISTS idx_supermarkets_location ON public.supermarkets(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_supermarkets_postal_code ON public.supermarkets(postal_code);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_supermarkets_search ON public.supermarkets 
USING gin(to_tsvector('dutch', name || ' ' || chain || ' ' || city || ' ' || COALESCE(postal_code, '')));

-- Row Level Security (RLS)
ALTER TABLE public.supermarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;

-- Public read access policy
CREATE POLICY "Public read access" ON public.supermarkets
    FOR SELECT USING (true);

-- Only service role can write
CREATE POLICY "Service write access" ON public.supermarkets
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read metadata" ON public.sync_metadata
    FOR SELECT USING (true);

CREATE POLICY "Service write metadata" ON public.sync_metadata
    FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update timestamps
CREATE TRIGGER update_supermarkets_updated_at
    BEFORE UPDATE ON public.supermarkets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_metadata_updated_at
    BEFORE UPDATE ON public.sync_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();