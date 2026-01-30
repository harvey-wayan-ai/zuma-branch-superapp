-- Migration: Update master_mutasi_whs VIEW to respect dnpb_match
-- Date: 2026-01-30
-- Purpose: Exclude RO allocations from calculation when dnpb_match = TRUE
--          (prevents double-counting when DNPB already exists in transaksi tables)

DROP VIEW IF EXISTS branch_super_app_clawdbot.master_mutasi_whs;

CREATE VIEW branch_super_app_clawdbot.master_mutasi_whs AS
WITH ddd_manual AS (
    SELECT "Artikel",
        sum(COALESCE("Transaksi in", 0)) AS in_qty,
        sum(COALESCE("transaksi out", 0)) AS out_qty
    FROM branch_super_app_clawdbot."supabase_transkasiDDD"
    GROUP BY "Artikel"
), ljbb_manual AS (
    SELECT "Artikel",
        sum(COALESCE("Transaksi in", 0)) AS in_qty,
        sum(COALESCE("transaksi out", 0)) AS out_qty
    FROM branch_super_app_clawdbot."supabase_transkasiLJBB"
    GROUP BY "Artikel"
), mbb_manual AS (
    SELECT "Artikel",
        sum(COALESCE("Transaksi in", 0)) AS in_qty,
        sum(COALESCE("transaksi out", 0)) AS out_qty
    FROM branch_super_app_clawdbot."supabase_transkasiMBB"
    GROUP BY "Artikel"
), ro_totals AS (
    -- Only count RO allocations where dnpb_match = FALSE
    -- If dnpb_match = TRUE, the transaction is already recorded in transaksi tables
    SELECT article_code,
        sum(CASE WHEN COALESCE(dnpb_match, FALSE) = FALSE THEN COALESCE(boxes_allocated_ddd, 0) ELSE 0 END) AS ro_out_ddd,
        sum(CASE WHEN COALESCE(dnpb_match, FALSE) = FALSE THEN COALESCE(boxes_allocated_ljbb, 0) ELSE 0 END) AS ro_out_ljbb
    FROM branch_super_app_clawdbot.ro_process
    GROUP BY article_code
), master_base AS (
    SELECT 'DDD'::text AS "Entitas",
        "Kode Artikel",
        "Nama Artikel",
        "Tier",
        "S. AWAL"
    FROM branch_super_app_clawdbot."supabase_stockawalDDD"
    UNION ALL
    SELECT 'LJBB'::text AS "Entitas",
        "Kode Artikel",
        "Nama Artikel",
        "Tier",
        "S. AWAL"
    FROM branch_super_app_clawdbot."supabase_stockawalLJBB"
    UNION ALL
    SELECT 'MBB'::text AS "Entitas",
        "Kode Artikel",
        "Nama Artikel",
        "Tier",
        "S. AWAL"
    FROM branch_super_app_clawdbot."supabase_stockawalMBB"
)
SELECT b."Entitas",
    b."Kode Artikel",
    b."Nama Artikel",
    b."Tier",
    CASE WHEN b."Entitas" = 'DDD' THEN b."S. AWAL" ELSE 0 END AS "Stock Awal DDD",
    CASE WHEN b."Entitas" = 'LJBB' THEN b."S. AWAL" ELSE 0 END AS "Stock Awal LJBB",
    CASE WHEN b."Entitas" = 'MBB' THEN b."S. AWAL" ELSE 0 END AS "Stock Awal MBB",
    0 AS "Stock Awal UBB",
    COALESCE(dt.in_qty, 0) AS "DDD Transaksi IN",
    COALESCE(dt.out_qty, 0) + COALESCE(ro.ro_out_ddd, 0) AS "DDD Transaksi OUT",
    COALESCE(lt.in_qty, 0) AS "LJBB Transaksi IN",
    COALESCE(lt.out_qty, 0) + COALESCE(ro.ro_out_ljbb, 0) AS "LJBB Transaksi OUT",
    COALESCE(mt.in_qty, 0) AS "MBB Transaksi IN",
    COALESCE(mt.out_qty, 0) AS "MBB Transaksi OUT",
    0 AS "UBB Transaksi IN",
    0 AS "UBB Transaksi OUT",
    COALESCE(dt.in_qty, 0) - (COALESCE(dt.out_qty, 0) + COALESCE(ro.ro_out_ddd, 0)) AS "Stock Akhir DDD",
    COALESCE(lt.in_qty, 0) - (COALESCE(lt.out_qty, 0) + COALESCE(ro.ro_out_ljbb, 0)) AS "Stock Akhir LJBB",
    COALESCE(mt.in_qty, 0) - COALESCE(mt.out_qty, 0) AS "Stock Akhir MBB",
    0 AS "Stock Akhir UBB",
    b."S. AWAL" AS "Stock Awal Total",
    COALESCE(dt.in_qty, 0) + COALESCE(lt.in_qty, 0) + COALESCE(mt.in_qty, 0) AS "Transaksi IN Total",
    COALESCE(dt.out_qty, 0) + COALESCE(ro.ro_out_ddd, 0) + COALESCE(lt.out_qty, 0) + COALESCE(ro.ro_out_ljbb, 0) + COALESCE(mt.out_qty, 0) AS "Transaksi OUT Total",
    (COALESCE(dt.in_qty, 0) - (COALESCE(dt.out_qty, 0) + COALESCE(ro.ro_out_ddd, 0))) +
    (COALESCE(lt.in_qty, 0) - (COALESCE(lt.out_qty, 0) + COALESCE(ro.ro_out_ljbb, 0))) +
    (COALESCE(mt.in_qty, 0) - COALESCE(mt.out_qty, 0)) AS "Stock Akhir Total"
FROM master_base b
LEFT JOIN ddd_manual dt ON b."Kode Artikel"::text = dt."Artikel"::text AND b."Entitas" = 'DDD'
LEFT JOIN ljbb_manual lt ON b."Kode Artikel"::text = lt."Artikel"::text AND b."Entitas" = 'LJBB'
LEFT JOIN mbb_manual mt ON b."Kode Artikel"::text = mt."Artikel"::text AND b."Entitas" = 'MBB'
LEFT JOIN ro_totals ro ON b."Kode Artikel"::text = ro.article_code::text;
