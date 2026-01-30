# DNPB Matching Logic

**Status: ✅ DATABASE UPDATED (2026-01-30)**

## Overview

DNPB (Delivery Note Pengiriman Barang) is a delivery note document used to track shipments from warehouse to stores.

## New Columns in ro_process

| Column | Type | Description |
|--------|------|-------------|
| `dnpb_number` | VARCHAR(100) | DNPB document number, e.g., `DNPB/DDD/WHS/2026/I/001` |
| `dnpb_match` | BOOLEAN | TRUE if dnpb_number matches a transaction in transaction tables |

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

## Matching Logic (Future Implementation)

### When user inputs DNPB number:

1. User enters DNPB number in RO Process page (at specific stage)
2. System saves to `ro_process.dnpb_number`
3. System checks if DNPB exists in transaction tables:

```sql
-- Check in all transaction tables
SELECT 1 FROM public.supabase_transaksiDDD WHERE "DNPB" = :dnpb_number
UNION
SELECT 1 FROM public.supabase_transaksiLJBB WHERE "DNPB" = :dnpb_number
UNION
SELECT 1 FROM public.supabase_transaksiMBB WHERE "DNPB" = :dnpb_number
-- UNION SELECT 1 FROM public.supabase_transaksiUBB WHERE "DNPB" = :dnpb_number  -- when available
```

4. If match found:
   - Set `ro_process.dnpb_match = TRUE`
   - **Cancel calculations in master_mutasi_whs** (stock already moved via transaction)

5. If no match:
   - Set `ro_process.dnpb_match = FALSE`
   - Continue normal calculations in master_mutasi_whs

## Impact on master_mutasi_whs

When `dnpb_match = TRUE`:
- The stock movement is already recorded in transaction tables
- Do NOT double-count by also deducting from master_mutasi_whs
- The ro_process record is for tracking/reference only

When `dnpb_match = FALSE`:
- Normal calculation applies
- master_mutasi_whs deducts the allocated boxes

## RO Process Stage for DNPB Input

The DNPB number should be entered at one of these stages:
- **PICK_VERIFIED** - After picking is verified
- **READY_TO_SHIP** - When shipment is being prepared
- **IN_DELIVERY** - When goods are dispatched

(Exact stage TBD based on business process)

## Future API Endpoint

```
POST /api/ro/update-dnpb
{
  "ro_id": "RO-2601-0001",
  "dnpb_number": "DNPB/DDD/WHS/2026/I/001"
}

Response:
{
  "success": true,
  "dnpb_match": true,
  "matched_in": "supabase_transaksiDDD"
}
```

## TODO

- [ ] Add DNPB input field in RO Process UI (at correct stage)
- [ ] Create API endpoint to update DNPB number
- [ ] Implement DNPB matching logic with transaction tables
- [x] ~~Update master_mutasi_whs calculations to respect dnpb_match~~ ✅ DONE
- [ ] Add validation for DNPB format
- [ ] Handle UBB transactions when table becomes available

## Completed Changes

### 2026-01-30: Database Updates

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
*Last Updated: 2026-01-30*
*Schema: branch_super_app_clawdbot*
