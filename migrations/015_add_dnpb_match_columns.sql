ALTER TABLE branch_super_app_clawdbot.ro_process 
ADD COLUMN IF NOT EXISTS dnpb_match_ddd BOOLEAN DEFAULT false;

ALTER TABLE branch_super_app_clawdbot.ro_process 
ADD COLUMN IF NOT EXISTS dnpb_match_ljbb BOOLEAN DEFAULT false;

UPDATE branch_super_app_clawdbot.ro_process 
SET dnpb_match_ddd = dnpb_match 
WHERE dnpb_match = true;
