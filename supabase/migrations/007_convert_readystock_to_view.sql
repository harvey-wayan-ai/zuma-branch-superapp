-- Migration: Convert ro_whs_readystock from TABLE to VIEW
-- Purpose: Dynamic real-time stock calculation that auto-updates when source tables change
-- Formula: ro_whs_readystock = ro_stockwhs - ro_process (for active statuses)

-- Step 1: Drop existing triggers and functions that were used for table-based approach
DROP TRIGGER IF EXISTS trigger_recalculate_on_process_change ON ro_process;
DROP TRIGGER IF EXISTS trigger_recalculate_on_stock_change ON ro_stockwhs;
DROP FUNCTION IF EXISTS calculate_ready_stock();

-- Step 2: Drop the existing table (data will be lost - this is intentional as VIEW is calculated)
DROP TABLE IF EXISTS ro_whs_readystock CASCADE;

-- Step 3: Create the VIEW for real-time available stock calculation
-- This VIEW automatically reflects changes from both ro_stockwhs and ro_process
CREATE OR REPLACE VIEW ro_whs_readystock AS
SELECT 
    s.article_code,
    s.article_name,
    -- DDD available: DDD stock minus allocated in active processes
    GREATEST(0, 
        COALESCE(s.ddd_stock, 0) - 
        COALESCE(SUM(CASE 
            WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
            THEN p.boxes_allocated_ddd 
            ELSE 0 
        END), 0)
    ) AS ddd_available,
    -- LJBB available: LJBB stock minus allocated in active processes  
    GREATEST(0, 
        COALESCE(s.ljbb_stock, 0) - 
        COALESCE(SUM(CASE 
            WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
            THEN p.boxes_allocated_ljbb 
            ELSE 0 
        END), 0)
    ) AS ljbb_available,
    -- Total available: Total stock minus all allocated boxes
    GREATEST(0, 
        COALESCE(s.total_stock, 0) - 
        COALESCE(SUM(CASE 
            WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
            THEN (p.boxes_allocated_ddd + p.boxes_allocated_ljbb)
            ELSE 0 
        END), 0)
    ) AS total_available,
    -- Metadata
    NOW() AS last_calculated
FROM ro_stockwhs s
LEFT JOIN ro_process p ON s.article_code = p.article_code
GROUP BY 
    s.article_code, 
    s.article_name, 
    s.ddd_stock, 
    s.ljbb_stock, 
    s.total_stock;

-- Step 4: Add indexes on source tables for VIEW performance
-- These indexes help the VIEW query run efficiently
CREATE INDEX IF NOT EXISTS idx_ro_process_article_status ON ro_process(article_code, status);
CREATE INDEX IF NOT EXISTS idx_ro_process_article_code ON ro_process(article_code);

-- Step 5: Enable RLS on the VIEW (requires security_invoker in PostgreSQL 15+)
-- Note: RLS on views works differently - we need to use security_barrier or security_invoker
-- For Supabase, we typically grant access via policies on underlying tables

COMMENT ON VIEW ro_whs_readystock IS 
    'Dynamic VIEW calculating available stock: ro_stockwhs - active ro_process allocations. ' ||
    'Auto-updates when either source table changes. ' ||
    'Statuses subtracted: QUEUE, PROCESSING, DELIVERY, COMPLETE. ' ||
    'Statuses NOT subtracted: DNPB done, CANCELLED, COMPLETED';
