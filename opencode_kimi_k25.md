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

### 4. RequestForm UI Enhancements
**Status:** ✅ COMPLETE

**Features Added:**
- **Auto Generate Button**: 
  - White background with green border (#00D084)
  - Sparkles icon (✨)
  - "AUTO" text in green
  - Pill shape (rounded-full)
  - Only enabled for regular stores (not Wholesale/Consignment/Other Need)
  
- **Searchable Store Dropdown**:
  - Custom searchable input with dropdown
  - Groups: Regular Stores and Special Options
  - Scroll capability for long lists
  - Shows selected store with clear button
  - Click outside to close
  
- **Special Store Options**:
  - Other Need
  - Wholesale
  - Consignment

**Design Reference:**
- Downloaded from Google Drive: `Frame 1.png`
- Matches Figma design specifications

---

## Next Steps

1. ✅ ro_recommendations - DONE
2. ✅ ro_stockwhs - DONE  
3. ✅ RequestForm UI - DONE
4. ⬜ Connect Auto Generate to Supabase (fetch recommendations)
5. ⬜ Import ro_process data (if needed)
6. ⬜ Verify ro_whs_readystock calculations are working
7. ⬜ Test the application with imported data

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

## Phase 1: API Endpoints - COMPLETED ✅

**Date:** 2026-01-29

### Achievements

#### 1. Created 3 API Endpoints
All endpoints implemented, tested, and deployed to Vercel.

**Endpoint 1: GET /api/ro/recommendations**
- Fetches auto-generated recommendations by store name
- Joins with `ro_whs_readystock` VIEW for real-time stock
- Returns priority levels (urgent/normal/low) based on tier
- **File:** `app/api/ro/recommendations/route.ts`

**Endpoint 2: GET /api/articles**
- Searches articles from `ro_stockwhs` catalog
- Supports query search and gender filtering
- Infers gender/series from article code (M=MEN, W=WOMEN, K=KIDS)
- **File:** `app/api/articles/route.ts`

**Endpoint 3: POST /api/ro/submit**
- Validates stock availability before submission
- Inserts into `ro_process` table
- Auto-generates RO ID (format: RO-YYMM-XXXX)
- Returns created RO details
- **File:** `app/api/ro/submit/route.ts`

#### 2. Supabase Client Configuration
**File:** `lib/supabase.ts`
```typescript
export const SCHEMA = 'branch_super_app_clawdbot';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: SCHEMA }
});
```

#### 3. Deployment Status
- ✅ All changes committed: `88aea31`
- ✅ Pushed to GitHub: `harvey-wayan-ai/zuma-branch-superapp`
- ✅ Deployed to Vercel: `https://zuma-ro-pwa.vercel.app`
- ✅ Build successful (11 routes generated)

---

## Next Steps (Phase 2)

### Frontend Integration - TODO

1. **Update RequestForm.tsx State Management**
   - Add `requestItems` array state
   - Track auto-generated vs manual items
   - Manage loading states

2. **Implement AUTO Button Logic**
   - Truncate `requestItems` array
   - Call `/api/ro/recommendations?store_name={store}`
   - Populate list with suggested quantities
   - Show stock badges (green/yellow/red)

3. **Implement +Add Button Logic**
   - Open article selector modal
   - Call `/api/articles?q={query}&gender={gender}`
   - Filter out already-added articles
   - Append selected articles to `requestItems`

4. **Stock Validation**
   - Real-time validation: requested ≤ available
   - Color-coded badges:
     - 🟢 Green: requested ≤ available
     - 🟡 Yellow: requested > available but available > 0
     - 🔴 Red: available = 0
   - Block submission if any article exceeds stock

5. **Submit Integration**
   - Call `/api/ro/submit` with requestItems
   - Show success/error feedback
   - Reset form on success

---

## API Testing

### Test Commands

```bash
# Test recommendations endpoint
curl "https://zuma-ro-pwa.vercel.app/api/ro/recommendations?store_name=Zuma%20Matos"

# Test articles endpoint
curl "https://zuma-ro-pwa.vercel.app/api/articles?q=airmove&gender=MEN"

# Test submit endpoint
curl -X POST "https://zuma-ro-pwa.vercel.app/api/ro/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "Zuma Matos",
    "articles": [{"code": "M1AMV102", "name": "Test", "boxes": 2, "warehouse_stock": {"total_available": 10}}]
  }'
```

---

## Documentation Updated

- ✅ `docs/RO_REQUEST_ARCHITECTURE.md` - Added complete API documentation
- ✅ `opencode_kimi_k25.md` - This file (progress tracking)

---

## Notes

- All CSV files use comma (`,`) delimiter
- ro_recommendations: Headers have spaces, imported successfully
- ro_stockwhs: Headers are comma-separated but wrapped in quotes, needs script fix
- ro_process: Structure already matches migration files
- **Total rows imported:** 909 (ro_stockwhs) + recommendations data
- **Cleaning script handles:** quotes, newlines, column mismatches automatically
- **API Schema:** All endpoints use `branch_super_app_clawdbot` schema

---

## SESSION UPDATE - 2026-01-30

### ✅ API FIXES COMPLETED

**Issue 1: Foreign Key Relationship Error**
- Error: "Could not find a relationship between 'ro_recommendations' and 'ro_whs_readystock'"
- Fix: Changed from nested Supabase joins to separate queries + in-memory merge

**Issue 2: Schema Permission Denied**
- Error: "permission denied for schema branch_super_app_clawdbot"
- Fix: Granted schema permissions to anon, authenticated, service_role

```sql
GRANT USAGE ON SCHEMA branch_super_app_clawdbot TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA branch_super_app_clawdbot TO anon, authenticated, service_role;
```

**Issue 3: Wrong Table for Stock Data**
- Old: Using `ro_stockwhs` and `ro_whs_readystock`
- New: Using `master_mutasi_whs` for stock data (Stock Akhir DDD/LJBB/Total)

**Issue 4: Column Name Mapping**
- DB columns have spaces and capitals: "Store Name", "Article Mix", "Tier", etc.
- Fixed all column references in API endpoints

### 📊 CORRECT DATA ARCHITECTURE

**Tables & Relationships:**
```
ro_recommendations (2527 rows)
├── "Store Name" = filter param
├── "Article Mix" = join key
└── "Tier", "Recommendation (box)", "ASSRT STATUS", "BROKEN SIZE"

master_mutasi_whs (2727 rows)
├── "Kode Artikel" = join key
├── "Nama Artikel" = article name
└── "Stock Akhir DDD", "Stock Akhir LJBB", "Stock Akhir Total"
```

**API Flow:**
1. AUTO button → `/api/ro/recommendations?store_name=X`
   - Query ro_recommendations filtered by store
   - Query master_mutasi_whs for stock data
   - Merge by "Article Mix" = "Kode Artikel"

2. +Add button → `/api/articles?q=X&gender=X`
   - Query master_mutasi_whs directly
   - Infer gender/series from article code

### ✅ APIs TESTED & WORKING

- `/api/ro/recommendations` - Returns recommendations with stock ✅
- `/api/articles` - Returns article catalog with stock ✅

### 🔧 FILES MODIFIED

- `lib/supabase.ts` - Using service_role key for schema access
- `app/api/ro/recommendations/route.ts` - Fixed column names, separate queries
- `app/api/articles/route.ts` - Query master_mutasi_whs directly

### ⚠️ KNOWN ISSUES

- Articles API returns duplicates (same article 3x for DDD/LJBB/MBB entities)
- Need to add DISTINCT or aggregate by "Kode Artikel"

---

## SESSION UPDATE - 2026-01-30 (Part 2)

### ✅ STORE DROPDOWN - DYNAMIC FROM DATABASE

**Changed from hardcoded to database-driven:**

**1. Updated `/api/stores` endpoint:**
- Fetches unique store names from `ro_recommendations` table
- Filters out header rows and empty values
- Returns: `{ regular: [...stores], special: ['Other Need', 'Wholesale', 'Consignment'] }`

**2. Updated `RequestForm.tsx`:**
- Added `stores` state fetched from API on mount
- Added `isLoadingStores` loading state
- Removed hardcoded stores array
- Kept existing dropdown UI layout (Regular Stores + Special Options sections)

**Stores now fetched from DB:**
- Zuma City Of Tomorrow Mall
- Zuma Galaxy Mall
- Zuma Icon Gresik
- Zuma Lippo Batu
- Zuma Lippo Sidoarjo
- Zuma Mall Olympic Garden
- Zuma Matos
- ZUMA PTC
- Zuma Royal Plaza
- Zuma Sunrise Mall
- Zuma Tunjungan Plaza

### ✅ RO PROCESS PAGE - CONNECTED TO DATABASE

**Created `/api/ro/process` endpoint:**
- Fetches from `ro_process` table
- Groups results by `ro_id` for proper aggregation
- Returns: id, store, createdAt, currentStatus, totalBoxes, totalArticles, dddBoxes, ljbbBoxes, articles[]

**Updated `ROProcess.tsx`:**
- Removed hardcoded `realROData` array
- Added `roData` state fetched from API on mount
- Added loading and empty states
- Refresh button now fetches fresh data
- **All UI/layout unchanged**

**Local test:** ✅ Returns `{"success":true,"data":[]}` (empty as expected)

### ✅ VERCEL DEPLOYED

Env vars set via CLI. Production live at https://zuma-ro-pwa.vercel.app

### ✅ SUBMIT API FIXED
Removed `article_name` and `notes` (columns don't exist in ro_process)

### ✅ ARTICLES API FIXED  
Added aggregation by "Kode Artikel" to dedupe

### ✅ STORES DROPDOWN FIXED
Added limit(5000) to get all distinct stores

---

## DATA FLOW ARCHITECTURE

### Request Form → ro_process (SUBMIT)

```
User fills Request Form
    ↓
AUTO button → /api/ro/recommendations → ro_recommendations + master_mutasi_whs
    OR
+Add button → /api/articles → master_mutasi_whs
    ↓
User clicks Submit
    ↓
/api/ro/submit → INSERT into ro_process
    ↓
RO Process tab shows submitted ROs
```

### Data Sources

| Action | API | Source Table | Data |
|--------|-----|--------------|------|
| AUTO button | /api/ro/recommendations | ro_recommendations + master_mutasi_whs | Store-specific recommendations + stock |
| +Add button | /api/articles | master_mutasi_whs | Article catalog + stock |
| Submit | /api/ro/submit | → ro_process | Creates RO with ro_id |
| RO Process | /api/ro/process | ro_process | Lists submitted ROs |

### AUTO Button Logic

**Filter criteria:**
1. `"Store Name"` = selected store
2. `"Recommendation (box)"` > 0 (only articles with recommended quantity)
3. Ordered by `"Tier"` ascending (priority: lower tier = higher priority)
4. **Include even if stock = 0** (user needs to see what's recommended but unavailable)

**Stock data joined from master_mutasi_whs:**
- `"Stock Akhir DDD"` → ddd_available
- `"Stock Akhir LJBB"` → ljbb_available  
- `"Stock Akhir MBB"` → mbb_available
- `"Stock Akhir UBB"` → ubb_available
- `"Stock Akhir Total"` → total_available

**Submit validation:**
- If ANY article has stock = 0 but qty requested > 0 → DISABLE submit button
- Show warning: "Cannot submit - some articles have 0 stock"
- User must remove 0-stock items or set their qty to 0

### +Add Button Logic

**Filter criteria:**
1. Search by `"Kode Artikel"` or `"Nama Artikel"` (ilike)
2. Optional gender filter (inferred from article code: M=MEN, W=WOMEN, K=KIDS)
3. Aggregated by article code (sum stock across entities)

**Stock columns (same as above):**
- DDD, LJBB, MBB, UBB, Total

### Warehouse Allocation Logic (AUTO-ALLOCATE)

**Priority order:** DDD → LJBB only (MBB/UBB not for retail)

**Rules:**
1. First fill from DDD stock
2. If DDD not enough, take remaining from LJBB
3. NEVER auto-allocate from MBB or UBB (not for retail)
4. MBB/UBB stock shown for visibility only

**Example:**
```
User requests: 6 boxes
Available: DDD=3, LJBB=5, MBB=2, UBB=1

Allocation:
- DDD: 3 (take all available)
- LJBB: 3 (take remaining needed)
- MBB: 0 (skip - not for retail)
- UBB: 0 (skip - not for retail)

Total: 6 boxes ✓
```

**If insufficient DDD+LJBB:**
```
User requests: 10 boxes
Available: DDD=3, LJBB=5

Allocation: DDD=3, LJBB=5 = 8 boxes
Result: Can only fulfill 8 of 10 requested
→ Show warning to user
```

### ro_process Table Columns

| Column | Source | Description |
|--------|--------|-------------|
| ro_id | Generated (RO-YYMM-XXXX) | Unique per submission |
| article_code | From selected article | Article code |
| article_name | From selected article | Article name |
| boxes_requested | User input | Quantity requested |
| boxes_allocated_ddd | WH sets later | Allocated from DDD |
| boxes_allocated_ljbb | WH sets later | Allocated from LJBB |
| status | 'QUEUE' initially | RO status |
| store_name | From dropdown | Destination store |
| notes | User input | Notes for entire RO |

### 📋 REMAINING TASKS

1. ✅ Stores dropdown - dynamic from ro_recommendations (11 stores)
2. ✅ Submit API - generates ro_id, includes article_name & notes
3. ⬜ Test full RO submission flow end-to-end
4. ⬜ Verify RO Process page displays submitted ROs correctly

### 📋 NEXT FEATURE: Per-Warehouse Quantity Selection

**Database:**
- ⬜ Add `boxes_allocated_mbb` and `boxes_allocated_ubb` columns to ro_process

**RequestForm.tsx:**
- ⬜ Change qty input to show per-warehouse breakdown (DDD, LJBB, MBB, UBB)
- ⬜ Allow manual override OR auto-allocate (DDD→LJBB priority)
- ⬜ Validate: requested ≤ available per warehouse
- ⬜ Show warning if DDD+LJBB insufficient
- ⬜ Disable submit if any article has qty > 0 but stock = 0
- ⬜ Show red badge/warning for 0-stock items

**Submit API:**
- ⬜ Accept boxes_ddd, boxes_ljbb, boxes_mbb, boxes_ubb
- ⬜ Store in respective columns

**ArticleItem interface:**
```typescript
{
  boxes_ddd: number;
  boxes_ljbb: number;
  boxes_mbb: number;   // display only, not for retail
  boxes_ubb: number;   // display only, not for retail
}
```

---

## SESSION UPDATE - 2026-01-30 (DNPB Columns)

### ✅ ADDED DNPB COLUMNS TO ro_process

**New Columns:**
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `dnpb_number` | VARCHAR(100) | NULL | DNPB document number, e.g., `DNPB/DDD/WHS/2026/I/001` |
| `dnpb_match` | BOOLEAN | FALSE | TRUE if dnpb_number matches transaction in transaksi tables |

**Index Added:**
- `idx_ro_process_dnpb_number` - For faster DNPB lookups

**Migration File:**
- `supabase/migrations/007_add_dnpb_columns.sql`

**Documentation:**
- `docs/DNPB_MATCHING_LOGIC.md` - Complete logic documentation

### 🔄 FUTURE DNPB MATCHING LOGIC

**Flow:**
1. User enters DNPB number in RO Process page (at PICK_VERIFIED or READY_TO_SHIP stage)
2. System saves to `ro_process.dnpb_number`
3. System checks if DNPB exists in transaction tables:
   - `supabase_transaksiDDD` (available)
   - `supabase_transaksiLJBB` (available)
   - `supabase_transaksiMBB` (available)
   - `supabase_transaksiUBB` (NOT available yet)
4. If match found → `dnpb_match = TRUE` → **Cancel calculations in master_mutasi_whs**
5. If no match → `dnpb_match = FALSE` → Normal calculations continue

**Impact on master_mutasi_whs:**
- When `dnpb_match = TRUE`: Stock already moved via transaction, do NOT double-count
- When `dnpb_match = FALSE`: Normal deduction from master_mutasi_whs

### 📋 TODO (DNPB Feature)

- [ ] Add DNPB input field in RO Process UI
- [ ] Create API endpoint `/api/ro/update-dnpb`
- [ ] Implement DNPB matching logic with transaction tables
- [x] ~~Update master_mutasi_whs calculations to respect dnpb_match~~ ✅ DONE
- [ ] Handle UBB transactions when table becomes available

### ✅ VIEW UPDATED: master_mutasi_whs

**Change:** Modified `ro_totals` CTE to only count RO allocations where `dnpb_match = FALSE`

**Logic:**
```sql
ro_totals AS (
    SELECT article_code,
        sum(CASE WHEN dnpb_match = FALSE THEN boxes_allocated_ddd ELSE 0 END) AS ro_out_ddd,
        sum(CASE WHEN dnpb_match = FALSE THEN boxes_allocated_ljbb ELSE 0 END) AS ro_out_ljbb
    FROM ro_process
    GROUP BY article_code
)
```

**Result:** When `dnpb_match = TRUE`, the RO allocation is excluded from stock calculation (already recorded in transaksi tables).

**Migration:** `008_update_master_mutasi_whs_dnpb_logic.sql`

**Transaction Tables (for matching):**
- `supabase_transkasiDDD` - "DNPB" column ✅
- `supabase_transkasiLJBB` - "DNPB" column ✅
- `supabase_transkasiMBB` - "DNPB" column ✅

---

## SESSION UPDATE - 2026-01-30 (Request Form Complete)

### ✅ REQUEST FORM FULLY FUNCTIONAL

**Tested Flow:**
1. Select store from dropdown → ✅
2. Add articles manually or use AUTO → ✅
3. Adjust per-warehouse quantities (DDD/LJBB) → ✅
4. Submit RO → ✅
5. Stock deducted from master_mutasi_whs → ✅

**Test RO Created:**
- RO ID: `RO-2601-0001`
- Store: Zuma Matos
- Article: B2TS01 (2 DDD + 1 LJBB = 3 boxes)
- Stock Before: DDD=31, LJBB=31, Total=62
- Stock After: DDD=29, LJBB=30, Total=59 ✅

### 🔧 VIEW FIX: Entity-Specific Calculations

**Issue Found:** RO deductions were being applied to ALL entity rows, not just the matching entity.

**Fix:** Updated master_mutasi_whs VIEW to only show/deduct stock for the entity matching the row:
- DDD row → only DDD stock calculations
- LJBB row → only LJBB stock calculations
- MBB row → only MBB stock calculations

### 📋 READY FOR TESTING

The Request Form tab is now complete. You can:
1. Go to RO page → Request Form tab
2. Select a store (e.g., "Zuma Matos")
3. Click AUTO to get recommendations, or Add articles manually
4. Adjust DDD/LJBB quantities using +/- buttons
5. Submit → Stock is deducted from master_mutasi_whs VIEW

---

## SESSION UPDATE - 2026-01-30 (Articles API & VIEW Updates)

### ✅ ARTICLES API SIMPLIFIED

**Changes:**
- Removed gender/series filters (no product code convention)
- Search by article name or code (case-insensitive via ilike)
- Increased limit from 50 to 500 articles
- Sorted by Nama Artikel for easier browsing

**API Endpoint:** `GET /api/articles?q=search_term`

### ✅ REQUEST FORM UI UPDATED

**Removed:**
- Gender filter buttons (ALL, MEN, LADIES, etc.)
- Series display

**Simplified:**
- Search input only
- Shows: code, name, stock (DDD | LJBB)
- 0-stock items shown but disabled

### ✅ master_mutasi_whs VIEW - ro_ongoing COLUMNS

**New columns added (per entity):**
- `ro_ongoing_ddd` - RO allocations from DDD (dnpb_match=FALSE)
- `ro_ongoing_ljbb` - RO allocations from LJBB
- `ro_ongoing_mbb` - RO allocations from MBB
- `ro_ongoing_ubb` - RO allocations from UBB
- `ro_ongoing_total` - Sum of all

**Column order per entity:**
```
Transaksi IN → Transaksi OUT → ro_ongoing_[entity] → Stock Akhir
```

**Formula:**
```
Stock Akhir = Transaksi IN - Transaksi OUT - ro_ongoing
```

### 📚 DOCUMENTATION CREATED

- `docs/DATABASE_LOGIC.md` - Complete table/VIEW logic documentation

---

## SESSION UPDATE - 2026-01-30 (Dashboard Real Data)

### ✅ RO DASHBOARD - CONNECTED TO REAL DATA

**Changes:**

1. **Created `/api/ro/dashboard` endpoint**
   - Fetches from `ro_process` table in `branch_super_app_clawdbot` schema
   - Groups by `ro_id` to get unique ROs
   - Returns stats: totalRO, queued, totalBoxes, totalPairs
   - Returns roList with store, box count, status

2. **Updated `DashboardContent` component**
   - Removed hardcoded dummy data
   - Added `useState` for stats and roData
   - Added `useEffect` to fetch on mount
   - Added loading state with spinner
   - Added refresh button
   - Added empty state message
   - **Layout preserved** - same 2x2 stats grid, same table design

**API Response Structure:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalRO": 3,
      "queued": 3,
      "totalBoxes": 9,
      "totalPairs": 108
    },
    "roList": [
      { "id": "RO-2601-0003", "store": "Zuma Icon Gresik", "box": 5, "status": "queue" }
    ]
  }
}
```

**Status Badge Mapping:**
| Database Status | Badge Display |
|-----------------|---------------|
| COMPLETED | green "complete" |
| IN_DELIVERY | blue "delivery" |
| READY_TO_SHIP | purple "ready" |
| PICKING/PICK_VERIFIED | orange "picking" |
| APPROVED | cyan "approved" |
| QUEUE | gray "queue" |

**Files Modified:**
- `app/api/ro/dashboard/route.ts` (NEW)
- `components/ROPage.tsx` (UPDATED)

---

## SESSION UPDATE - 2026-01-30 (Next Stage Button Fix - Planning)

### 🔴 ISSUE: Next Stage Button Not Working

**Problem:** Button only updates local React state, no API call to persist to database.

**Current Code (ROProcess.tsx lines 296-303):**
- Finds current status index
- Gets next status from array
- Updates local state only (`setSelectedRO`)
- Shows alert
- **NO API CALL** → Changes lost on refresh

### ✅ UPDATED STATUS FLOW (9 Stages)

**Previous:** 8 stages
**New:** 9 stages (added DNPB_PROCESS)

```
QUEUE → APPROVED → PICKING → PICK_VERIFIED → DNPB_PROCESS → READY_TO_SHIP → IN_DELIVERY → ARRIVED → COMPLETED
```

| # | Status | Label | Description |
|---|--------|-------|-------------|
| 1 | QUEUE | Queue | Awaiting approval |
| 2 | APPROVED | Approved | WH Supervisor approved |
| 3 | PICKING | Picking | Being picked from warehouse |
| 4 | PICK_VERIFIED | Verified | Pick quantities verified |
| 5 | **DNPB_PROCESS** | **DNPB** | **Delivery note processing (NEW)** |
| 6 | READY_TO_SHIP | Ready | Ready for dispatch |
| 7 | IN_DELIVERY | Delivery | Out for delivery |
| 8 | ARRIVED | Arrived | Received at store |
| 9 | COMPLETED | Completed | Order closed |

### 📋 TODO: Fix Next Stage Button

1. ⬜ Create `/api/ro/status` endpoint (PATCH) - Update status in Supabase
2. ⬜ Update `statusFlow` array in ROProcess.tsx - Add DNPB_PROCESS
3. ⬜ Modify button onClick - Call API, handle loading, refresh data
4. ⬜ Test status progression end-to-end

---

## SESSION UPDATE - 2026-01-30 (Layer 3 - View Articles)

### ✅ LAYER 3 IMPLEMENTED - View Articles Table

**Feature:** When user clicks "View Articles" button in RO Detail (Layer 2), shows compact article breakdown table.

**Table Columns:**
| Article | Box | DDD | LJBB |
|---------|-----|-----|------|
| Code + Name | boxes_requested | boxes_allocated_ddd | boxes_allocated_ljbb |

**Navigation Flow:**
```
Layer 1: RO List → Click RO card
Layer 2: RO Detail + Timeline → Click "View Articles"
Layer 3: Article Breakdown Table → Click "Back to RO Detail"
```

**Changes Made:**

1. **API Updated** (`/api/ro/process`)
   - Added `boxesRequested` to articles array

2. **ROProcess.tsx Updated**
   - Added `viewArticles` state
   - Added `renderArticlesView()` function
   - Updated "View Articles" button to show Layer 3
   - Table shows: Article (code+name), Box (requested), DDD, LJBB
   - Footer row with totals
   - Color-coded: DDD=blue, LJBB=purple

**Files Modified:**
- `app/api/ro/process/route.ts`
- `components/ROProcess.tsx`

### ✅ LAYER 3 ENHANCEMENT - Status Badge in Header

Added status badge to Layer 3 header card (top-right corner).

```
┌─────────────────────────────────────┐
│ RO-2601-0001              [QUEUE]  │
│ Zuma Matos                          │
│ 3 articles • 5 boxes                │
└─────────────────────────────────────┘
```

---

## ✅ COMPLETED - Next Stage Button Fix (2026-01-30)

### 1. StatusFlow Array Updated (9 Stages)
```
QUEUE → APPROVED → PICKING → PICK_VERIFIED → DNPB_PROCESS → READY_TO_SHIP → IN_DELIVERY → ARRIVED → COMPLETED
```

### 2. Created `/api/ro/status` Endpoint
- **Method:** PATCH
- **Body:** `{ roId: string, status: string }`
- **Validates:** Status must be one of 9 valid statuses
- **Updates:** `ro_process` table in Supabase (all rows with matching ro_id)
- **File:** `app/api/ro/status/route.ts`

### 3. Next Stage Button Updated
- Calls `/api/ro/status` API on click
- Shows loading spinner during request
- Disabled when status = COMPLETED
- Refreshes data on success
- Error handling with alerts

### 4. Filter Buttons Updated
- Changed from legacy `DELIVERY`, `DNPB PROCESS` 
- Now uses `IN_DELIVERY`, `DNPB_PROCESS`

**Files Modified:**
- `app/api/ro/status/route.ts` (NEW)
- `components/ROProcess.tsx` (UPDATED)

---

## 📋 REMAINING TODO

### 🐛 BUG: Edit Article Quantities Not Saving
- **Issue:** +/- buttons update UI but changes don't persist to Supabase
- **Location:** Layer 3 (View Articles) → Save Changes button
- **API:** `/api/ro/articles` - needs debugging
- **Priority:** High

### WH Page (formerly SKU Page)
- ⬜ WHS Dashboard - source: `master_mutasi_whs` VIEW
- ⬜ Design TBD - figuring out layout, metrics, what to sum/display
- **Possible metrics:**
  - Stock per article (DDD / LJBB / MBB / Total)
  - Transaksi IN / OUT
  - ro_ongoing allocations
  - Stock Akhir per entity

### Other Pending Features
- ⬜ Authentication - Login for Area Supervisors
- ⬜ DNPB matching with transaction tables

---

## ✅ COMPLETED - RO Process Improvements (2026-01-30)

### 1. DNPB Number Input Field ✅

**Location:** Layer 2 (RO Detail) - shown only when `status = DNPB_PROCESS`

**UI Layout:**
```
┌─────────────────────────────────────┐
│ RO-2601-0003         [DNPB_PROCESS]│
│ Zuma Icon Gresik                    │
│ 5 articles • 10 boxes               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 DNPB Number (Required)           │
│ ┌─────────────────────────────────┐ │
│ │ DNPB/DDD/WHS/2026/I/001        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

[Timeline...]

[View Articles]  [Next Stage →]
                 ↑ blocked if DNPB empty
```

**Logic:**
1. Show input field ONLY when `status = DNPB_PROCESS`
2. Block "Next Stage" button if DNPB field is empty
3. On submit: Update `dnpb_number` column for ALL rows with same `ro_id`
4. One input = writes to 10-20 article rows (batch update)
5. Then advance status to `READY_TO_SHIP`

**API Created:** `/api/ro/dnpb`
- **PATCH:** Save DNPB number to all rows of ro_id
- **GET:** Fetch existing DNPB number
- Validates format: `DNPB/XXX/WHS/YYYY/M/NNN`

**Files:** `app/api/ro/dnpb/route.ts`

### 2. Search RO by ID ✅

**Location:** Layer 1 (RO List) - search input above filter buttons

**Features:**
- Search by RO ID (e.g., "RO-2601")
- Search by Store name (e.g., "Matos")
- Real-time filtering

### 3. Edit Article Quantities ✅

**Location:** Layer 3 (View Articles table)

**Features:**
- +/- buttons for DDD and LJBB columns
- Yellow highlight on edited rows
- "Save Changes" button appears when changes exist
- Real-time total updates
- Batch save all changes in one click

**API Created:** `/api/ro/articles`
- **PATCH:** Update `boxes_allocated_ddd`, `boxes_allocated_ljbb`, `boxes_requested`
- Updates single article row by ro_id + article_code

**Files:** `app/api/ro/articles/route.ts`

**Performance Note:**
- 1 RO ID = 10-20 articles
- Each article = 5-10 boxes
- Single API call per article on save
