# RO Warehouse Ready Stock - Dynamic VIEW Mechanism

## Overview

The `ro_whs_readystock` is a **PostgreSQL VIEW** (not a table) that dynamically calculates available warehouse stock in real-time. It automatically reflects changes from both source tables without requiring manual updates.

## Why VIEW Instead of Table?

| Aspect | TABLE (Old) | VIEW (New) |
|--------|-------------|------------|
| **Data Freshness** | Requires triggers/scheduled updates | Always real-time |
| **Data Duplication** | Stores calculated data | No duplication, calculates on query |
| **Sync Issues** | Risk of stale data | Always accurate |
| **Performance** | Fast reads, slow updates | Slightly slower reads, zero update overhead |
| **Maintenance** | Complex trigger logic | Simple, self-updating |

## How It Works

### Formula

```
ready_stock = ro_stockwhs.total_stock - SUM(ro_process.allocated_boxes)
              WHERE ro_process.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE')
```

### Source Tables

1. **ro_stockwhs** - Master warehouse stock
   - `kode_artikel` (article_code)
   - `nama_artikel` (article_name)
   - `qty_box_ddd` (DDD location stock)
   - `qty_box_ljbb` (LJBB location stock)
   - `total` (total stock)

2. **ro_process** - Active RO allocations
   - `article_code`
   - `boxes_allocated_ddd`
   - `boxes_allocated_ljbb`
   - `status` (QUEUE, PROCESSING, DELIVERY, COMPLETE, DNPB done, CANCELLED)

### Status Rules

**Statuses that SUBTRACT from available stock:**
- `QUEUE` - Waiting to be processed
- `PROCESSING` - Being prepared
- `DELIVERY` - Out for delivery
- `COMPLETE` - Delivered but not yet confirmed

**Statuses that DO NOT subtract:**
- `DNPB done` - Already completed, stock already deducted
- `CANCELLED` - Order cancelled, stock returned

## VIEW Definition

```sql
CREATE OR REPLACE VIEW branch_super_app_clawdbot.ro_whs_readystock AS
SELECT 
    s.kode_artikel AS article_code,
    s.nama_artikel AS article_name,
    GREATEST(0, 
        COALESCE(s.qty_box_ddd, 0) - 
        COALESCE(SUM(CASE 
            WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
            THEN p.boxes_allocated_ddd 
            ELSE 0 
        END), 0)
    ) AS ddd_available,
    GREATEST(0, 
        COALESCE(s.qty_box_ljbb, 0) - 
        COALESCE(SUM(CASE 
            WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
            THEN p.boxes_allocated_ljbb 
            ELSE 0 
        END), 0)
    ) AS ljbb_available,
    GREATEST(0, 
        COALESCE(s.total, 0) - 
        COALESCE(SUM(CASE 
            WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
            THEN (p.boxes_allocated_ddd + p.boxes_allocated_ljbb)
            ELSE 0 
        END), 0)
    ) AS total_available,
    NOW() AS last_calculated
FROM branch_super_app_clawdbot.ro_stockwhs s
LEFT JOIN branch_super_app_clawdbot.ro_process p ON s.kode_artikel = p.article_code
GROUP BY 
    s.kode_artikel, 
    s.nama_artikel, 
    s.qty_box_ddd, 
    s.qty_box_ljbb, 
    s.total;
```

## Usage Examples

### Get ready stock for RO Request card

```sql
SELECT 
    article_code,
    article_name,
    total_available as ready_stock,
    ddd_available,
    ljbb_available
FROM branch_super_app_clawdbot.ro_whs_readystock
WHERE article_code = 'Z2VB04';
```

### Get all articles with available stock

```sql
SELECT *
FROM branch_super_app_clawdbot.ro_whs_readystock
WHERE total_available > 0
ORDER BY total_available DESC;
```

### Check stock breakdown with allocations

```sql
SELECT 
    v.article_code,
    v.article_name,
    s.total as total_stock,
    COALESCE(SUM(p.boxes_allocated_ddd + p.boxes_allocated_ljbb), 0) as allocated_in_active_ro,
    v.total_available as ready_stock
FROM branch_super_app_clawdbot.ro_whs_readystock v
JOIN branch_super_app_clawdbot.ro_stockwhs s ON v.article_code = s.kode_artikel
LEFT JOIN branch_super_app_clawdbot.ro_process p 
    ON v.article_code = p.article_code 
    AND p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE')
GROUP BY v.article_code, v.article_name, s.total, v.total_available;
```

## Performance Optimization

Indexes on source tables for faster VIEW queries:

```sql
-- Index for joining ro_process by article and status
CREATE INDEX idx_ro_process_article_status 
ON branch_super_app_clawdbot.ro_process(article_code, status);

-- Index for joining ro_stockwhs by article code
CREATE INDEX idx_ro_stockwhs_kode_artikel 
ON branch_super_app_clawdbot.ro_stockwhs(kode_artikel);
```

## Data Flow

```
┌─────────────────┐         ┌─────────────────┐
│  ro_stockwhs    │         │   ro_process    │
│  (master stock) │         │ (RO allocations)│
└────────┬────────┘         └────────┬────────┘
         │                           │
         │     ┌───────────────┐     │
         └────►│ro_whs_readystock│◄────┘
               │    (VIEW)      │
               └───────┬────────┘
                       │
              ┌────────▼────────┐
              │  RO Request UI  │
              │  (shows ready   │
              │   stock)        │
              └─────────────────┘
```

## Important Notes

1. **No manual refresh needed** - The VIEW calculates on every query
2. **Always accurate** - Reflects latest data from both tables
3. **GREATEST(0, ...)** - Prevents negative stock values
4. **COALESCE** - Handles NULL values gracefully
5. **LEFT JOIN** - Shows all articles even if no RO allocations exist

## Migration History

- **Created**: 2026-01-29
- **Migration File**: `007_convert_readystock_to_view.sql`
- **Previous**: Was a TABLE with triggers (003_create_ro_whs_readystock.sql)
- **Reason for Change**: Eliminate sync issues, ensure real-time accuracy

## Related Files

- Migration: `/supabase/migrations/007_convert_readystock_to_view.sql`
- Architecture: `/docs/RO_REQUEST_ARCHITECTURE.md`
- Implementation Plan: `/RO_IMPLEMENTATION_PLAN.md`
