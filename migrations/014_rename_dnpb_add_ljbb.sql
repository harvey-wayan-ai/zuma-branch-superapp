ALTER TABLE branch_super_app_clawdbot.ro_process 
RENAME COLUMN dnpb_number TO dnpb_number_ddd;

ALTER TABLE branch_super_app_clawdbot.ro_process 
ADD COLUMN dnpb_number_ljbb VARCHAR(100);

DROP INDEX IF EXISTS idx_ro_process_dnpb_number;

CREATE INDEX idx_ro_process_dnpb_ddd 
ON branch_super_app_clawdbot.ro_process(dnpb_number_ddd);

CREATE INDEX idx_ro_process_dnpb_ljbb 
ON branch_super_app_clawdbot.ro_process(dnpb_number_ljbb);
