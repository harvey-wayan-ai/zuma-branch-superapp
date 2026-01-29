-- Migration: Add RO ID Auto-Generation
-- Format: RO-YYMM-XXXX (e.g., RO-2601-0001)
-- YY = 2-digit year, MM = 2-digit month, XXXX = sequence per month

-- Create sequence table for RO ID tracking
CREATE TABLE IF NOT EXISTS ro_id_sequences (
    year_month VARCHAR(4) PRIMARY KEY, -- Format: YYMM
    last_sequence INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate next RO ID
CREATE OR REPLACE FUNCTION generate_ro_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_year_month VARCHAR(4);
    v_next_seq INTEGER;
    v_ro_id VARCHAR(50);
BEGIN
    -- Get current year-month (YYMM format)
    v_year_month := TO_CHAR(NOW(), 'YYMM');
    
    -- Get or create sequence for this month
    INSERT INTO ro_id_sequences (year_month, last_sequence)
    VALUES (v_year_month, 0)
    ON CONFLICT (year_month) 
    DO UPDATE SET 
        last_sequence = ro_id_sequences.last_sequence + 1,
        updated_at = NOW()
    RETURNING last_sequence INTO v_next_seq;
    
    -- If insert succeeded (new month), sequence starts at 1
    IF v_next_seq IS NULL THEN
        UPDATE ro_id_sequences 
        SET last_sequence = 1,
            updated_at = NOW()
        WHERE year_month = v_year_month
        RETURNING last_sequence INTO v_next_seq;
    ELSE
        v_next_seq := v_next_seq + 1;
    END IF;
    
    -- Generate RO ID: RO-YYMM-XXXX
    v_ro_id := 'RO-' || v_year_month || '-' || LPAD(v_next_seq::TEXT, 4, '0');
    
    RETURN v_ro_id;
END;
$$ LANGUAGE plpgsql;

-- Alternative: Use as DEFAULT value in INSERT
-- Note: This requires the sequence table to be populated first

-- Function to auto-generate RO ID on insert (if not provided)
CREATE OR REPLACE FUNCTION auto_generate_ro_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ro_id IS NULL OR NEW.ro_id = '' THEN
        NEW.ro_id := generate_ro_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ro_process table
DROP TRIGGER IF EXISTS trigger_auto_generate_ro_id ON ro_process;
CREATE TRIGGER trigger_auto_generate_ro_id
    BEFORE INSERT ON ro_process
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_ro_id();

-- Enable RLS on sequence table
ALTER TABLE ro_id_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON ro_id_sequences
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for service role" ON ro_id_sequences
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE ro_id_sequences IS 'Tracks RO ID sequences per month (YYMM)';
COMMENT ON FUNCTION generate_ro_id() IS 'Generates next RO ID in format RO-YYMM-XXXX';

-- Example usage:
-- INSERT INTO ro_process (article_code, boxes_requested, status) 
-- VALUES ('M1AMV102', 5, 'QUEUE');
-- -- ro_id will be auto-generated as RO-2601-0001, RO-2601-0002, etc.
