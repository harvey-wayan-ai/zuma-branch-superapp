# Database Logic & Table Mechanisms

## Schema: `branch_super_app_clawdbot`

---

## 1. ro_process Table

Stores all RO (Replenishment Order) allocations.

### Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | UUID | auto | Primary key |
| ro_id | VARCHAR(50) | - | Auto-generated: RO-YYMM-XXXX |
| article_code | VARCHAR(50) | - | Product code |
| article_name | VARCHAR(255) | - | Product name |
| boxes_requested | INTEGER | 0 | Total boxes requested |
| boxes_allocated_ddd | INTEGER | 0 | Boxes from DDD warehouse |
| boxes_allocated_ljbb | INTEGER | 0 | Boxes from LJBB warehouse |
| boxes_allocated_mbb | INTEGER | 0 | Boxes from MBB warehouse (internal use) |
| boxes_allocated_ubb | INTEGER | 0 | Boxes from UBB warehouse (internal use) |
| status | VARCHAR(50) | 'QUEUE' | Current RO status |
| store_name | VARCHAR(255) | - | Destination store |
| notes | TEXT | - | Optional notes |
| dnpb_number | VARCHAR(100) | NULL | Delivery Note number (e.g., DNPB/DDD/WHS/2026/I/001) |
| dnpb_match | BOOLEAN | FALSE | TRUE if DNPB exists in transaction tables |
| created_at | TIMESTAMP | now() | Creation time |
| updated_at | TIMESTAMP | now() | Last update time |

### Business Rules

1. **Frontend Only Allows DDD & LJBB:**
   - Users can only request boxes from DDD and LJBB warehouses
   - MBB and UBB are NOT for retail - internal warehouse use only
   - MBB/UBB columns exist for warehouse staff to manually adjust if needed

2. **RO ID Format:** `RO-YYMM-XXXX`
   - YY = 2-digit year
   - MM = 2-digit month
   - XXXX = sequential number (resets each month)
   - Example: RO-2601-0001

3. **Status Flow:**
   ```
   QUEUE → APPROVED → PICKING → PICK_VERIFIED → READY_TO_SHIP → IN_DELIVERY → ARRIVED → COMPLETED
     │
     └─► CANCELLED (from any status except COMPLETED)
   ```

4. **DNPB Matching:**
   - When `dnpb_number` is set, system checks transaction tables
   - If match found: `dnpb_match = TRUE`
   - If `dnpb_match = TRUE`: RO allocation excluded from stock calculation (already counted in transaksi)

---

## 2. master_mutasi_whs VIEW

Calculated VIEW that combines stock, transactions, and RO allocations.

### Column Order (per entity)

For each entity (DDD, LJBB, MBB, UBB), columns appear in this order:

| # | Column | Description |
|---|--------|-------------|
| 1 | Stock Awal [Entity] | Initial stock from supabase_stockawal[Entity] |
| 2 | [Entity] Transaksi IN | SUM of "Transaksi in" from supabase_transkasi[Entity] |
| 3 | [Entity] Transaksi OUT | SUM of "transaksi out" from supabase_transkasi[Entity] |
| 4 | ro_ongoing_[entity] | SUM of boxes_allocated_[entity] WHERE dnpb_match = FALSE |
| 5 | Stock Akhir [Entity] | Transaksi IN - Transaksi OUT - ro_ongoing |

### Full Column List

```
Entitas
Kode Artikel
Nama Artikel
Tier
Stock Awal DDD
Stock Awal LJBB
Stock Awal MBB
Stock Awal UBB
DDD Transaksi IN
DDD Transaksi OUT
ro_ongoing_ddd          <-- NEW: RO allocations pending
LJBB Transaksi IN
LJBB Transaksi OUT
ro_ongoing_ljbb         <-- NEW: RO allocations pending
MBB Transaksi IN
MBB Transaksi OUT
ro_ongoing_mbb          <-- NEW: RO allocations pending
UBB Transaksi IN
UBB Transaksi OUT
ro_ongoing_ubb          <-- NEW: RO allocations pending
Stock Akhir DDD
Stock Akhir LJBB
Stock Akhir MBB
Stock Akhir UBB
Stock Awal Total
Transaksi IN Total
Transaksi OUT Total
ro_ongoing_total        <-- NEW: Total RO allocations pending
Stock Akhir Total
```

### Calculation Formula

```
Stock Akhir [Entity] = Transaksi IN - Transaksi OUT - ro_ongoing_[entity]

Where:
- Transaksi IN = SUM from supabase_transkasi[Entity]."Transaksi in"
- Transaksi OUT = SUM from supabase_transkasi[Entity]."transaksi out"
- ro_ongoing_[entity] = SUM from ro_process.boxes_allocated_[entity] 
                        WHERE dnpb_match = FALSE
```

### ro_ongoing Logic

```sql
ro_totals AS (
    SELECT article_code,
        sum(CASE WHEN dnpb_match = FALSE THEN boxes_allocated_ddd ELSE 0 END) AS ro_ongoing_ddd,
        sum(CASE WHEN dnpb_match = FALSE THEN boxes_allocated_ljbb ELSE 0 END) AS ro_ongoing_ljbb,
        sum(CASE WHEN dnpb_match = FALSE THEN boxes_allocated_mbb ELSE 0 END) AS ro_ongoing_mbb,
        sum(CASE WHEN dnpb_match = FALSE THEN boxes_allocated_ubb ELSE 0 END) AS ro_ongoing_ubb
    FROM ro_process
    GROUP BY article_code
)
```

**Key Points:**
- Only counts allocations where `dnpb_match = FALSE`
- When `dnpb_match = TRUE`, the stock movement is already in transaksi tables
- This prevents double-counting

### Entity-Specific Rows

Each row in the VIEW represents ONE entity:
- Row with Entitas='DDD' → only shows DDD stock/transactions
- Row with Entitas='LJBB' → only shows LJBB stock/transactions
- Row with Entitas='MBB' → only shows MBB stock/transactions

### Data Sources

| Data | Source Table |
|------|--------------|
| Stock Awal DDD | supabase_stockawalDDD."S. AWAL" |
| Stock Awal LJBB | supabase_stockawalLJBB."S. AWAL" |
| Stock Awal MBB | supabase_stockawalMBB."S. AWAL" |
| DDD Transaksi | supabase_transkasiDDD |
| LJBB Transaksi | supabase_transkasiLJBB |
| MBB Transaksi | supabase_transkasiMBB |
| ro_ongoing_* | ro_process (where dnpb_match = FALSE) |

---

## 3. DNPB Matching Logic

DNPB = Delivery Note Pengiriman Barang

### Flow

1. User submits RO → `ro_process` row created with `dnpb_match = FALSE`
2. RO goes through status flow (QUEUE → APPROVED → ... → IN_DELIVERY)
3. At delivery stage, user inputs DNPB number (e.g., `DNPB/DDD/WHS/2026/I/001`)
4. System checks if DNPB exists in transaction tables:
   - `supabase_transkasiDDD."DNPB"`
   - `supabase_transkasiLJBB."DNPB"`
   - `supabase_transkasiMBB."DNPB"`
5. If match found → `dnpb_match = TRUE`
6. RO allocation excluded from `ro_ongoing_*` calculation

### Why This Matters

**Without DNPB matching (double-counting problem):**
```
Stock Akhir = Transaksi IN - Transaksi OUT - ro_ongoing

If same delivery is in BOTH transaksi AND ro_process:
→ Stock deducted TWICE (once in Transaksi OUT, once in ro_ongoing)
→ WRONG!
```

**With DNPB matching:**
```
When dnpb_match = TRUE:
→ ro_ongoing excludes this RO
→ Stock only deducted once (in Transaksi OUT)
→ CORRECT!
```

---

## 4. Frontend Behavior

### Request Form (User-Facing)

| Warehouse | User Can Request? | Reason |
|-----------|-------------------|--------|
| DDD | ✅ YES | Primary retail warehouse |
| LJBB | ✅ YES | Secondary retail warehouse |
| MBB | ❌ NO | Not for retail (internal) |
| UBB | ❌ NO | Not for retail (internal) |

### Per-Warehouse Quantity Controls

Users see +/- buttons for:
- DDD quantity (capped at ddd_available)
- LJBB quantity (capped at ljbb_available)

MBB and UBB are hidden from user interface but columns exist in database for warehouse staff.

---

## 5. Example Scenario

### Before RO
```
Article: B2TS01
DDD Transaksi IN: 73
DDD Transaksi OUT: 42
ro_ongoing_ddd: 0
Stock Akhir DDD: 73 - 42 - 0 = 31
```

### After RO Submit (2 boxes DDD, 1 box LJBB)
```
Article: B2TS01
DDD Transaksi IN: 73
DDD Transaksi OUT: 42
ro_ongoing_ddd: 2          <-- NEW RO allocation
Stock Akhir DDD: 73 - 42 - 2 = 29

LJBB Transaksi IN: 31
LJBB Transaksi OUT: 0
ro_ongoing_ljbb: 1         <-- NEW RO allocation
Stock Akhir LJBB: 31 - 0 - 1 = 30
```

### After DNPB Match (delivery recorded in transaksi)
```
Article: B2TS01
DDD Transaksi IN: 73
DDD Transaksi OUT: 44      <-- Increased by 2 (delivery recorded)
ro_ongoing_ddd: 0          <-- Excluded (dnpb_match = TRUE)
Stock Akhir DDD: 73 - 44 - 0 = 29   <-- Same result, no double-count
```

---

*Last Updated: 2026-01-30*
*Migration: 009_update_master_mutasi_whs_ro_ongoing.sql*
