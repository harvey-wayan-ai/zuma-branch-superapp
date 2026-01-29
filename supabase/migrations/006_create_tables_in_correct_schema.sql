-- Create tables in branch_super_app_clawdbot schema

-- 1. ro_stockwhs - Master warehouse stock
CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.ro_stockwhs (
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

CREATE INDEX IF NOT EXISTS idx_ro_stockwhs_article_code ON branch_super_app_clawdbot.ro_stockwhs(article_code);
CREATE INDEX IF NOT EXISTS idx_ro_stockwhs_last_updated ON branch_super_app_clawdbot.ro_stockwhs(last_updated);

-- Trigger for total_stock
CREATE OR REPLACE FUNCTION branch_super_app_clawdbot.calculate_total_stock()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_stock = COALESCE(NEW.ddd_stock, 0) + COALESCE(NEW.ljbb_stock, 0);
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_total_stock ON branch_super_app_clawdbot.ro_stockwhs;
CREATE TRIGGER trigger_calculate_total_stock
    BEFORE INSERT OR UPDATE ON branch_super_app_clawdbot.ro_stockwhs
    FOR EACH ROW
    EXECUTE FUNCTION branch_super_app_clawdbot.calculate_total_stock();

-- 2. ro_process - Active RO allocations
CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.ro_process (
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

CREATE INDEX IF NOT EXISTS idx_ro_process_ro_id ON branch_super_app_clawdbot.ro_process(ro_id);
CREATE INDEX IF NOT EXISTS idx_ro_process_article_code ON branch_super_app_clawdbot.ro_process(article_code);
CREATE INDEX IF NOT EXISTS idx_ro_process_status ON branch_super_app_clawdbot.ro_process(status);

-- 3. ro_whs_readystock - Available stock
CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.ro_whs_readystock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_code VARCHAR(50) NOT NULL UNIQUE,
    article_name VARCHAR(255),
    ddd_available INTEGER DEFAULT 0,
    ljbb_available INTEGER DEFAULT 0,
    total_available INTEGER DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ro_whs_readystock_article_code ON branch_super_app_clawdbot.ro_whs_readystock(article_code);

-- 4. ro_recommendations - Auto-generated suggestions
CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.ro_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT,
    article_mix TEXT,
    gender TEXT,
    series TEXT,
    article TEXT,
    tier INTEGER,
    total_recommendation INTEGER DEFAULT 0,
    recommendation_box INTEGER DEFAULT 0,
    kode_kecil INTEGER DEFAULT 0,
    assay_status TEXT,
    broken_sizes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ro_recommendations_store_name ON branch_super_app_clawdbot.ro_recommendations(store_name);
CREATE INDEX IF NOT EXISTS idx_ro_recommendations_article_mix ON branch_super_app_clawdbot.ro_recommendations(article_mix);

-- 5. ro_id_sequences - For RO ID auto-generation
CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.ro_id_sequences (
    year_month VARCHAR(4) PRIMARY KEY,
    last_sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate RO ID
CREATE OR REPLACE FUNCTION branch_super_app_clawdbot.generate_ro_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_year_month VARCHAR(4);
    v_next_seq INTEGER;
    v_ro_id VARCHAR(50);
BEGIN
    v_year_month := TO_CHAR(NOW(), 'YYMM');
    
    INSERT INTO branch_super_app_clawdbot.ro_id_sequences (year_month, last_sequence)
    VALUES (v_year_month, 1)
    ON CONFLICT (year_month) 
    DO UPDATE SET 
        last_sequence = branch_super_app_clawdbot.ro_id_sequences.last_sequence + 1,
        updated_at = NOW()
    RETURNING last_sequence INTO v_next_seq;
    
    v_ro_id := 'RO-' || v_year_month || '-' || LPAD(v_next_seq::TEXT, 4, '0');
    RETURN v_ro_id;
END;
$$ LANGUAGE plpgsql;

-- Function for auto-generate RO ID on insert
CREATE OR REPLACE FUNCTION branch_super_app_clawdbot.auto_generate_ro_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ro_id IS NULL OR NEW.ro_id = '' THEN
        NEW.ro_id := branch_super_app_clawdbot.generate_ro_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_ro_id ON branch_super_app_clawdbot.ro_process;
CREATE TRIGGER trigger_auto_generate_ro_id
    BEFORE INSERT ON branch_super_app_clawdbot.ro_process
    FOR EACH ROW
    EXECUTE FUNCTION branch_super_app_clawdbot.auto_generate_ro_id();

-- Enable RLS
ALTER TABLE branch_super_app_clawdbot.ro_stockwhs ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_super_app_clawdbot.ro_process ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_super_app_clawdbot.ro_whs_readystock ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_super_app_clawdbot.ro_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_super_app_clawdbot.ro_id_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to all users" ON branch_super_app_clawdbot.ro_stockwhs FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON branch_super_app_clawdbot.ro_process FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON branch_super_app_clawdbot.ro_whs_readystock FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON branch_super_app_clawdbot.ro_recommendations FOR SELECT USING (true);

-- Comments
COMMENT ON TABLE branch_super_app_clawdbot.ro_stockwhs IS 'Master warehouse stock data (DDD/LJBB)';
COMMENT ON TABLE branch_super_app_clawdbot.ro_process IS 'Active RO allocations';
COMMENT ON TABLE branch_super_app_clawdbot.ro_whs_readystock IS 'Available stock for new ROs';
COMMENT ON TABLE branch_super_app_clawdbot.ro_recommendations IS 'Auto-generated RO recommendations';
