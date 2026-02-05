# DNPB Matching Logic

> **AI Agent Reference:** For complete app navigation, see [`AI_REFERENCE.md`](./AI_REFERENCE.md)  
> **Related:** [`APP_LOGIC.md`](./APP_LOGIC.md) - Application flowcharts | [`DATABASE_LOGIC.md`](./DATABASE_LOGIC.md) - Table schemas

**Status: ✅ DUAL DNPB SUPPORT IMPLEMENTED (2026-02-05)**

## Overview

DNPB (Delivery Note Pengiriman Barang) is a delivery note document used to track shipments from warehouse to stores.

## New Columns in ro_process

### Single DNPB (Legacy - Before v1.2.6)

| Column | Type | Description |
|--------|------|-------------|
| `dnpb_number` | VARCHAR(100) | DNPB document number, e.g., `DNPB/DDD/WHS/2026/I/001` |
| `dnpb_match` | BOOLEAN | TRUE if dnpb_number matches a transaction in transaction tables |

### Dual DNPB (Current - v1.2.6+)

| Column | Type | Description |
|--------|------|-------------|
| `dnpb_number_ddd` | VARCHAR(100) | DNPB for DDD warehouse |
| `dnpb_number_ljbb` | VARCHAR(100) | DNPB for LJBB warehouse |
| `dnpb_match_ddd` | BOOLEAN | TRUE if DDD DNPB matches supabase_transaksiDDD |
| `dnpb_match_ljbb` | BOOLEAN | TRUE if LJBB DNPB matches supabase_transaksiLJBB |

**Migration Files:**
- `014_rename_dnpb_add_ljbb.sql` - Rename dnpb_number → dnpb_number_ddd, add dnpb_number_ljbb
- `015_add_dnpb_match_columns.sql` - Add dnpb_match_ddd and dnpb_match_ljbb columns

## DNPB Number Format

```
DNPB/{ENTITY}/{LOCATION}/{YEAR}/{ROMAN_MONTH}/{SEQUENCE}

Example: DNPB/DDD/WHS/2026/I/001
- DNPB = Document type
- DDD = Warehouse entity (DDD, LJBB, MBB, UBB)
- WHS = Warehouse location
- 2026 = Year
- I = Roman numeral for January
- 001 = Sequence number
```

## Transaction Tables (for matching)

| Table | Entity | Status |
|-------|--------|--------|
| `supabase_transaksiDDD` | DDD warehouse | Available |
| `supabase_transaksiLJBB` | LJBB warehouse | Available |
| `supabase_transaksiMBB` | MBB warehouse | Available |
| `supabase_transaksiUBB` | UBB warehouse | NOT available yet |

## Matching Logic (Implemented)

### When user inputs DNPB number:

1. User enters DNPB number(s) in RO Process page (at DNPB_PROCESS stage)
2. System validates format: `DNPB/{WAREHOUSE}/WHS/{YEAR}/{ROMAN_MONTH}/{SEQUENCE}`
3. System validates against warehouse-specific transaction table:

**For DDD DNPB:**
```sql
SELECT 1 FROM public.supabase_transaksiDDD WHERE "DNPB" = :dnpb_number_ddd
```

**For LJBB DNPB:**
```sql
SELECT 1 FROM public.supabase_transaksiLJBB WHERE "DNPB" = :dnpb_number_ljbb
```

4. Dynamic form behavior:
   - If RO has DDD boxes → show DDD DNPB input
   - If RO has LJBB boxes → show LJBB DNPB input
   - If both → show both inputs

5. If match found:
   - Set `ro_process.dnpb_match_{warehouse} = TRUE`
   - **Cancel calculations in master_mutasi_whs** (stock already moved via transaction)

6. If no match:
   - Set `ro_process.dnpb_match_{warehouse} = FALSE`
   - Continue normal calculations in master_mutasi_whs

## Impact on master_mutasi_whs

When `dnpb_match_ddd = TRUE` OR `dnpb_match_ljbb = TRUE`:
- The stock movement is already recorded in transaction tables
- Do NOT double-count by also deducting from master_mutasi_whs
- The ro_process record is for tracking/reference only

When both `dnpb_match_ddd = FALSE` AND `dnpb_match_ljbb = FALSE`:
- Normal calculation applies
- master_mutasi_whs deducts the allocated boxes

## RO Process Stage for DNPB Input

The DNPB number should be entered at one of these stages:
- **PICK_VERIFIED** - After picking is verified
- **READY_TO_SHIP** - When shipment is being prepared
- **IN_DELIVERY** - When goods are dispatched

(Exact stage TBD based on business process)

## API Endpoints (Implemented)

### Update DNPB (v1.2.6+)

```
PATCH /api/ro/dnpb
{
  "roId": "RO-2601-0001",
  "dnpbNumberDDD": "DNPB/DDD/WHS/2026/I/001",
  "dnpbNumberLJBB": "DNPB/LJBB/WHS/2026/I/002"
}

Response:
{
  "success": true,
  "dnpbNumberDDD": "DNPB/DDD/WHS/2026/I/001",
  "dnpbNumberLJBB": "DNPB/LJBB/WHS/2026/I/002",
  "dnpbMatchDDD": true,
  "dnpbMatchLJBB": false
}
```

### Get RO Process (includes DNPB data)

```
GET /api/ro/process

Response includes:
{
  "dnpbNumberDDD": "DNPB/DDD/WHS/2026/I/001",
  "dnpbNumberLJBB": "DNPB/LJBB/WHS/2026/I/002",
  "dnpbMatchDDD": true,
  "dnpbMatchLJBB": false
}
```

## TODO

- [x] ~~Add DNPB input field in RO Process UI (at correct stage)~~ ✅ DONE (v1.2.6)
- [x] ~~Create API endpoint to update DNPB number~~ ✅ DONE (v1.2.6)
- [x] ~~Implement DNPB matching logic with transaction tables~~ ✅ DONE (v1.2.6)
- [x] ~~Update master_mutasi_whs calculations to respect dnpb_match~~ ✅ DONE
- [x] ~~Add validation for DNPB format~~ ✅ DONE (v1.2.6)
- [ ] Handle UBB transactions when table becomes available

## Completed Changes

### 2026-02-05: Dual DNPB Support (v1.2.6)

1. **Database Migrations:**
   - `014_rename_dnpb_add_ljbb.sql` - Renamed `dnpb_number` → `dnpb_number_ddd`, added `dnpb_number_ljbb`
   - `015_add_dnpb_match_columns.sql` - Added `dnpb_match_ddd` and `dnpb_match_ljbb` columns

2. **API Updates:**
   - `/api/ro/dnpb` - Now accepts `dnpbNumberDDD` and `dnpbNumberLJBB` parameters
   - Validates each DNPB against its respective warehouse transaction table
   - Returns separate match flags for each warehouse

3. **UI Updates:**
   - Dynamic DNPB form in ROProcess component
   - Shows DDD input only if RO has DDD boxes
   - Shows LJBB input only if RO has LJBB boxes
   - Format validation with user-friendly hints

4. **DNPB Error Tab:**
   - Displays both DNPB numbers with color coding (blue=DDD, purple=LJBB)
   - Banding & Confirmed buttons for dispute resolution

### 2026-01-30: Initial DNPB Implementation

1. **Added columns to `ro_process`:**
   - `dnpb_number` VARCHAR(100) - stores DNPB document number
   - `dnpb_match` BOOLEAN DEFAULT FALSE - indicates if matched with transaksi

2. **Updated `master_mutasi_whs` VIEW:**
   - Modified `ro_totals` CTE to exclude rows where `dnpb_match = TRUE`
   - Prevents double-counting when DNPB exists in both ro_process and transaksi tables

3. **Transaction tables confirmed:**
   - `supabase_transkasiDDD` - has "DNPB" column ✅
   - `supabase_transkasiLJBB` - has "DNPB" column ✅
   - `supabase_transkasiMBB` - has "DNPB" column ✅

---

*Created: 2026-01-30*
*Last Updated: 2026-02-05*
*Schema: branch_super_app_clawdbot*
