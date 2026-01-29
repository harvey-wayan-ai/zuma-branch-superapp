-- Migration: Create RO Warehouse Ready Stock Table
-- Source: READY STOCK - RO App - Mutasi Box WHS (Google Sheets)
-- Table: ro_whs_readystock
-- Formula: ro_whs_readystock = ro_stockwhs - ro_process

CREATE TABLE IF NOT EXISTS ro_whs_readystock (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ro_whs_readystock_article_code ON ro_whs_readystock(article_code);
CREATE INDEX IF NOT EXISTS idx_ro_whs_readystock_total_available ON ro_whs_readystock(total_available);

-- Function to calculate ready stock
CREATE OR REPLACE FUNCTION calculate_ready_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate available stock: master stock - allocated in active ROs
    UPDATE ro_whs_readystock
    SET 
        ddd_available = GREATEST(0, (
            SELECT COALESCE(SUM(ddd_stock), 0) 
            FROM ro_stockwhs 
            WHERE article_code = NEW.article_code
        ) - (
            SELECT COALESCE(SUM(boxes_allocated_ddd), 0)
            FROM ro_process
            WHERE article_code = NEW.article_code
            AND status NOT IN ('COMPLETED', 'CANCELLED')
        )),
        ljbb_available = GREATEST(0, (
            SELECT COALESCE(SUM(ljbb_stock), 0)
            FROM ro_stockwhs
            WHERE article_code = NEW.article_code
        ) - (
            SELECT COALESCE(SUM(boxes_allocated_ljbb), 0)
            FROM ro_process
            WHERE article_code = NEW.article_code
            AND status NOT IN ('COMPLETED', 'CANCELLED')
        )),
        total_available = GREATEST(0, (
            SELECT COALESCE(SUM(total_stock), 0)
            FROM ro_stockwhs
            WHERE article_code = NEW.article_code
        ) - (
            SELECT COALESCE(SUM(boxes_allocated_ddd + boxes_allocated_ljbb), 0)
            FROM ro_process
            WHERE article_code = NEW.article_code
            AND status NOT IN ('COMPLETED', 'CANCELLED')
        )),
        last_calculated = NOW(),
        updated_at = NOW()
    WHERE article_code = NEW.article_code;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate when ro_process changes
DROP TRIGGER IF EXISTS trigger_recalculate_on_process_change ON ro_process;
CREATE TRIGGER trigger_recalculate_on_process_change
    AFTER INSERT OR UPDATE OR DELETE ON ro_process
    FOR EACH ROW
    EXECUTE FUNCTION calculate_ready_stock();

-- Trigger to recalculate when ro_stockwhs changes
DROP TRIGGER IF EXISTS trigger_recalculate_on_stock_change ON ro_stockwhs;
CREATE TRIGGER trigger_recalculate_on_stock_change
    AFTER UPDATE ON ro_stockwhs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_ready_stock();

-- Enable RLS
ALTER TABLE ro_whs_readystock ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to all users" ON ro_whs_readystock
    FOR SELECT USING (true);

COMMENT ON TABLE ro_whs_readystock IS 'Available stock for new ROs (calculated: ro_stockwhs - ro_process)';
