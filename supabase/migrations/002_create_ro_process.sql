-- Migration: Create RO Process Table (Active RO Allocations)
-- Source: RO WHS App (Google Sheets)
-- Table: ro_process

CREATE TABLE IF NOT EXISTS ro_process (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ro_id VARCHAR(50) NOT NULL,
    article_code VARCHAR(50) NOT NULL,
    boxes_requested INTEGER DEFAULT 0,
    boxes_allocated_ddd INTEGER DEFAULT 0,
    boxes_allocated_ljbb INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'QUEUE',
    store_id UUID,
    store_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ro_process_ro_id ON ro_process(ro_id);
CREATE INDEX IF NOT EXISTS idx_ro_process_article_code ON ro_process(article_code);
CREATE INDEX IF NOT EXISTS idx_ro_process_status ON ro_process(status);
CREATE INDEX IF NOT EXISTS idx_ro_process_store_id ON ro_process(store_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ro_process ON ro_process;
CREATE TRIGGER trigger_update_ro_process
    BEFORE UPDATE ON ro_process
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE ro_process ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to all users" ON ro_process
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for authenticated users" ON ro_process
    FOR ALL USING (auth.role() IN ('authenticated', 'service_role'));

COMMENT ON TABLE ro_process IS 'Active RO allocations tracking stock committed to orders';
