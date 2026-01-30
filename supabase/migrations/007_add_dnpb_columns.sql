-- Migration: Add DNPB columns to ro_process
-- Date: 2026-01-30
-- Purpose: Support DNPB number tracking and matching with transaction tables

ALTER TABLE branch_super_app_clawdbot.ro_process 
ADD COLUMN IF NOT EXISTS dnpb_number VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dnpb_match BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN branch_super_app_clawdbot.ro_process.dnpb_number IS 'DNPB document number, e.g., DNPB/DDD/WHS/2026/I/001';
COMMENT ON COLUMN branch_super_app_clawdbot.ro_process.dnpb_match IS 'TRUE if dnpb_number matches a transaction in supabase_transaksiDDD/LJBB/MBB/UBB';

-- Add index for faster DNPB lookups
CREATE INDEX IF NOT EXISTS idx_ro_process_dnpb_number ON branch_super_app_clawdbot.ro_process(dnpb_number);
