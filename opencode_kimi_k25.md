# Zuma RO PWA - Database Import Progress

## Date: 2026-01-29

## Completed Tasks

### 1. Fixed ro_recommendations Table Import
**Issue:** "invalid input syntax for type integer: 'M1AMV102'"

**Root Cause:** 
- CSV column headers had spaces (e.g., "Store Name", "Article Mix")
- Table columns didn't match CSV headers exactly
- "kode kecil" and "Tier" columns needed to be VARCHAR instead of INTEGER

**Solution:**
- Recreated table with exact CSV column names including spaces
- Changed data types:
  - `Tier` → VARCHAR(50)
  - `kode kecil` → VARCHAR(50)
- Table now accepts direct CSV import from Supabase Dashboard

**Status:** ✅ COMPLETE - Successfully imported ro_recommendations data

---

### 2. Created ro_stockwhs Import Script
**Issue:** CSV exported from Google Sheets has malformed format with entire row wrapped in quotes

**CSV Format Problem:**
```
"No,Kode Artikel,Nama Artikel,Tier,..."
```
Instead of:
```
No,Kode Artikel,Nama Artikel,Tier,...
```

**Solution:**
Created automated script: `scripts/fix-and-import-ro_stockwhs.sh`

**Script Features:**
- Fixes CSV format by removing wrapping quotes
- Shows preview before import
- Truncates table before import
- Maps all 22 columns correctly
- Shows row count before/after
- Cleans up temporary files

**Usage:**
```bash
./scripts/fix-and-import-ro_stockwhs.sh "ro_stockwhs (Rekapan Box - Mutasi Box WHS).csv"
```

**Status:** ✅ COMPLETE - Script ready for use

---

## Table Relationships (From Documentation)

### Data Flow:
1. **ro_recommendations** + **ro_stockwhs** = Source tables (imported from Google Sheets)
2. **ro_process** = Active RO allocations (calculated from recommendations)
3. **ro_whs_readystock** = Available stock (calculated: ro_stockwhs - ro_process)

### Calculation Logic:
- `ro_whs_readystock` = Master stock minus allocated stock
- Triggers auto-recalculate when ro_process or ro_stockwhs changes
- Formula: Available = Stock - Allocated (excluding COMPLETED/CANCELLED)

---

## Files Downloaded from Google Drive

Location: `/root/clawd/harvey-projects/zuma-ro-pwa/data/`

1. **ro_process (roDatabase - RO WHS App).csv** (3.1 KB)
2. **ro_readystock (READY STOCK - RO App - Mutasi Box WHS).csv** (54.6 KB)
3. **ro_recommendations (forSupabase RO Input jatim).csv** (257 KB)
4. **ro_stockwhs (Rekapan Box - Mutasi Box WHS).csv** (69.1 KB)

---

## Supabase Connection Details

**Database:** PostgreSQL on Supabase
**Host:** db.rwctwnzckyepiwcufdlw.supabase.co
**Schema:** branch_super_app_clawdbot

**Tables Modified:**
- `ro_recommendations` - Recreated with proper column names
- `ro_stockwhs` - Script created for automated import

---

### 3. Successfully Imported ro_stockwhs Data
**Status:** ✅ COMPLETE - 909 rows imported

**Issues Fixed:**
- CSV had wrapping quotes around entire rows
- Double quotes in article names (`""` → `"`)
- Embedded newlines in 3 article codes
- Missing `100%_2` column in header
- `no` column renamed to `row_num` (PostgreSQL reserved word)

**Table Structure Updated:**
- Recreated table with correct column order
- 25 columns total (including id and created_at)
- All percentage columns as VARCHAR(10)

**Files Created:**
- `scripts/clean_ro_stockwhs.py` - Python script for cleaning and importing
- `import_guide_ro_stockwhs.md` - Complete step-by-step guide

---

## Next Steps

1. ✅ ro_recommendations - DONE
2. ✅ ro_stockwhs - DONE  
3. ⬜ Import ro_process data (if needed)
4. ⬜ Verify ro_whs_readystock calculations are working
5. ⬜ Test the application with imported data

---

## Files Created/Modified

### Documentation:
- `opencode_kimi_k25.md` - This progress file
- `import_guide_ro_stockwhs.md` - Complete import guide

### Scripts:
- `scripts/clean_ro_stockwhs.py` - Python cleaner + importer
- `scripts/fix-and-import-ro_stockwhs.sh` - Bash script (Linux)
- `scripts/fix-and-import-ro_stockwhs.bat` - Batch script (Windows)
- `scripts/clean-csv.bat` - Simple Windows cleaner
- `scripts/import-ro-recommendations.sh` - Recommendations import

### Data Files (Downloaded):
- `data/ro_recommendations (forSupabase RO Input jatim).csv`
- `data/ro_stockwhs (Rekapan Box - Mutasi Box WHS).csv`
- `data/ro_process (roDatabase - RO WHS App).csv`
- `data/ro_readystock (READY STOCK - RO App - Mutasi Box WHS).csv`

---

## Notes

- All CSV files use comma (`,`) delimiter
- ro_recommendations: Headers have spaces, imported successfully
- ro_stockwhs: Headers are comma-separated but wrapped in quotes, needs script fix
- ro_process: Structure already matches migration files
- **Total rows imported:** 909 (ro_stockwhs) + recommendations data
- **Cleaning script handles:** quotes, newlines, column mismatches automatically
