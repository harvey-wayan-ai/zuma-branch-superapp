-- Migration: Create RO Recommendations Table
-- Source: RO Input Jatim - forSupabase (Google Sheets)
-- Table: ro_recommendations

CREATE TABLE IF NOT EXISTS ro_recommendations (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ro_recommendations_store_name ON ro_recommendations(store_name);
CREATE INDEX IF NOT EXISTS idx_ro_recommendations_article_mix ON ro_recommendations(article_mix);
CREATE INDEX IF NOT EXISTS idx_ro_recommendations_gender ON ro_recommendations(gender);
CREATE INDEX IF NOT EXISTS idx_ro_recommendations_series ON ro_recommendations(series);
CREATE INDEX IF NOT EXISTS idx_ro_recommendations_tier ON ro_recommendations(tier);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_ro_recommendations ON ro_recommendations;
CREATE TRIGGER trigger_update_ro_recommendations
    BEFORE UPDATE ON ro_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE ro_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to all users" ON ro_recommendations
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for service role" ON ro_recommendations
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE ro_recommendations IS 'Auto-generated RO recommendations from algorithm (synced from Google Sheets)';

-- View to combine recommendations with available stock
CREATE OR REPLACE VIEW ro_recommendations_with_stock AS
SELECT 
    r.id,
    r.store_name,
    r.article_mix,
    r.gender,
    r.series,
    r.article,
    r.tier,
    r.total_recommendation,
    r.recommendation_box,
    r.kode_kecil,
    r.assay_status,
    r.broken_sizes,
    s.ddd_available,
    s.ljbb_available,
    s.total_available,
    CASE 
        WHEN s.total_available >= r.recommendation_box THEN 'AVAILABLE'
        WHEN s.total_available > 0 THEN 'PARTIAL'
        ELSE 'OUT_OF_STOCK'
    END as stock_status,
    r.created_at,
    r.updated_at
FROM ro_recommendations r
LEFT JOIN ro_whs_readystock s ON r.article_mix = s.article_code;

COMMENT ON VIEW ro_recommendations_with_stock IS 'Recommendations joined with real-time available stock';
