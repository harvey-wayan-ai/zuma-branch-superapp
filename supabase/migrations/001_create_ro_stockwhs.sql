-- Migration: Create RO Stock Warehouse Master Table
-- Source: Rekapan Box - Mutasi Box WHS (Google Sheets)
-- Table: ro_stockwhs

CREATE TABLE IF NOT EXISTS ro_stockwhs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_code VARCHAR(50) NOT NULL UNIQUE,
    article_name VARCHAR(255),
    ddd_stock INTEGER DEFAULT 0,
    ljbb_stock INTEGER DEFAULT 0,
    total_stock INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_source VARCHAR(100) DEFAULT 'google_sheets',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ro_stockwhs_article_code ON ro_stockwhs(article_code);
CREATE INDEX IF NOT EXISTS idx_ro_stockwhs_last_updated ON ro_stockwhs(last_updated);

-- Trigger to auto-update total_stock
CREATE OR REPLACE FUNCTION calculate_total_stock()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_stock = COALESCE(NEW.ddd_stock, 0) + COALESCE(NEW.ljbb_stock, 0);
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_total_stock ON ro_stockwhs;
CREATE TRIGGER trigger_calculate_total_stock
    BEFORE INSERT OR UPDATE ON ro_stockwhs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_stock();

-- Enable RLS
ALTER TABLE ro_stockwhs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to all users" ON ro_stockwhs
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for service role" ON ro_stockwhs
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE ro_stockwhs IS 'Master warehouse stock data from WHS system (DDD and LJBB locations)';
