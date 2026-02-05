CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.ro_banding_notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ro_id VARCHAR(50) NOT NULL,
    banding_by UUID REFERENCES auth.users(id),
    banding_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'PENDING',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ro_banding_notices_ro_id 
ON branch_super_app_clawdbot.ro_banding_notices(ro_id);

CREATE INDEX IF NOT EXISTS idx_ro_banding_notices_status 
ON branch_super_app_clawdbot.ro_banding_notices(status);
