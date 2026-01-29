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

## Next Steps

1. Run the ro_stockwhs import script with your CSV file
2. Import ro_process data (if needed)
3. Verify ro_whs_readystock calculations are working
4. Test the application with imported data

---

## Notes

- All CSV files use comma (`,`) delimiter
- ro_recommendations: Headers have spaces, imported successfully
- ro_stockwhs: Headers are comma-separated but wrapped in quotes, needs script fix
- ro_process: Structure already matches migration files
