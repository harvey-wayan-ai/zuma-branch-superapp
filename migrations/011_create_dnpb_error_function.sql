ALTER TABLE branch_super_app_clawdbot.ro_receipt 
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION branch_super_app_clawdbot.get_dnpb_error_ro_list()
RETURNS TABLE (
    ro_id VARCHAR,
    store_name VARCHAR,
    dnpb_number VARCHAR,
    total_items BIGINT,
    total_selisih BIGINT,
    confirmed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.ro_id,
        r.store_name,
        r.dnpb_number,
        COUNT(DISTINCT r.article_code)::BIGINT as total_items,
        COALESCE(SUM(r.selisih), 0)::BIGINT as total_selisih,
        MAX(r.received_at) as confirmed_at
    FROM branch_super_app_clawdbot.ro_receipt r
    WHERE r.is_confirmed = true
    GROUP BY r.ro_id, r.store_name, r.dnpb_number
    ORDER BY MAX(r.received_at) DESC;
END;
$$ LANGUAGE plpgsql;
