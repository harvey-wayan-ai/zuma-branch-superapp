-- Migration: Add ro_ongoing columns to master_mutasi_whs VIEW
-- Date: 2026-01-30
-- Purpose: Separate RO allocations into visible columns for monitoring
-- Column order: Transaksi IN, Transaksi OUT, ro_ongoing_[entity], then Stock Akhir

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
    SELECT article_code,
        sum(CASE WHEN COALESCE(dnpb_match, FALSE) = FALSE THEN COALESCE(boxes_allocated_ddd, 0) ELSE 0 END) AS ro_ongoing_ddd,
        sum(CASE WHEN COALESCE(dnpb_match, FALSE) = FALSE THEN COALESCE(boxes_allocated_ljbb, 0) ELSE 0 END) AS ro_ongoing_ljbb,
        sum(CASE WHEN COALESCE(dnpb_match, FALSE) = FALSE THEN COALESCE(boxes_allocated_mbb, 0) ELSE 0 END) AS ro_ongoing_mbb,
        sum(CASE WHEN COALESCE(dnpb_match, FALSE) = FALSE THEN COALESCE(boxes_allocated_ubb, 0) ELSE 0 END) AS ro_ongoing_ubb
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
    CASE WHEN b."Entitas" = 'DDD' THEN COALESCE(dt.in_qty, 0) ELSE 0 END AS "DDD Transaksi IN",
    CASE WHEN b."Entitas" = 'DDD' THEN COALESCE(dt.out_qty, 0) ELSE 0 END AS "DDD Transaksi OUT",
    CASE WHEN b."Entitas" = 'DDD' THEN COALESCE(ro.ro_ongoing_ddd, 0) ELSE 0 END AS "ro_ongoing_ddd",
    CASE WHEN b."Entitas" = 'LJBB' THEN COALESCE(lt.in_qty, 0) ELSE 0 END AS "LJBB Transaksi IN",
    CASE WHEN b."Entitas" = 'LJBB' THEN COALESCE(lt.out_qty, 0) ELSE 0 END AS "LJBB Transaksi OUT",
    CASE WHEN b."Entitas" = 'LJBB' THEN COALESCE(ro.ro_ongoing_ljbb, 0) ELSE 0 END AS "ro_ongoing_ljbb",
    CASE WHEN b."Entitas" = 'MBB' THEN COALESCE(mt.in_qty, 0) ELSE 0 END AS "MBB Transaksi IN",
    CASE WHEN b."Entitas" = 'MBB' THEN COALESCE(mt.out_qty, 0) ELSE 0 END AS "MBB Transaksi OUT",
    CASE WHEN b."Entitas" = 'MBB' THEN COALESCE(ro.ro_ongoing_mbb, 0) ELSE 0 END AS "ro_ongoing_mbb",
    0 AS "UBB Transaksi IN",
    0 AS "UBB Transaksi OUT",
    COALESCE(ro.ro_ongoing_ubb, 0) AS "ro_ongoing_ubb",
    CASE WHEN b."Entitas" = 'DDD' THEN COALESCE(dt.in_qty, 0) - COALESCE(dt.out_qty, 0) - COALESCE(ro.ro_ongoing_ddd, 0) ELSE 0 END AS "Stock Akhir DDD",
    CASE WHEN b."Entitas" = 'LJBB' THEN COALESCE(lt.in_qty, 0) - COALESCE(lt.out_qty, 0) - COALESCE(ro.ro_ongoing_ljbb, 0) ELSE 0 END AS "Stock Akhir LJBB",
    CASE WHEN b."Entitas" = 'MBB' THEN COALESCE(mt.in_qty, 0) - COALESCE(mt.out_qty, 0) - COALESCE(ro.ro_ongoing_mbb, 0) ELSE 0 END AS "Stock Akhir MBB",
    0 - COALESCE(ro.ro_ongoing_ubb, 0) AS "Stock Akhir UBB",
    b."S. AWAL" AS "Stock Awal Total",
    CASE WHEN b."Entitas" = 'DDD' THEN COALESCE(dt.in_qty, 0)
         WHEN b."Entitas" = 'LJBB' THEN COALESCE(lt.in_qty, 0)
         WHEN b."Entitas" = 'MBB' THEN COALESCE(mt.in_qty, 0)
         ELSE 0 END AS "Transaksi IN Total",
    CASE WHEN b."Entitas" = 'DDD' THEN COALESCE(dt.out_qty, 0)
         WHEN b."Entitas" = 'LJBB' THEN COALESCE(lt.out_qty, 0)
         WHEN b."Entitas" = 'MBB' THEN COALESCE(mt.out_qty, 0)
         ELSE 0 END AS "Transaksi OUT Total",
    COALESCE(ro.ro_ongoing_ddd, 0) + COALESCE(ro.ro_ongoing_ljbb, 0) + COALESCE(ro.ro_ongoing_mbb, 0) + COALESCE(ro.ro_ongoing_ubb, 0) AS "ro_ongoing_total",
    CASE WHEN b."Entitas" = 'DDD' THEN COALESCE(dt.in_qty, 0) - COALESCE(dt.out_qty, 0) - COALESCE(ro.ro_ongoing_ddd, 0)
         WHEN b."Entitas" = 'LJBB' THEN COALESCE(lt.in_qty, 0) - COALESCE(lt.out_qty, 0) - COALESCE(ro.ro_ongoing_ljbb, 0)
         WHEN b."Entitas" = 'MBB' THEN COALESCE(mt.in_qty, 0) - COALESCE(mt.out_qty, 0) - COALESCE(ro.ro_ongoing_mbb, 0)
         ELSE 0 - COALESCE(ro.ro_ongoing_ubb, 0) END AS "Stock Akhir Total"
FROM master_base b
LEFT JOIN ddd_manual dt ON b."Kode Artikel"::text = dt."Artikel"::text AND b."Entitas" = 'DDD'
LEFT JOIN ljbb_manual lt ON b."Kode Artikel"::text = lt."Artikel"::text AND b."Entitas" = 'LJBB'
LEFT JOIN mbb_manual mt ON b."Kode Artikel"::text = mt."Artikel"::text AND b."Entitas" = 'MBB'
LEFT JOIN ro_totals ro ON b."Kode Artikel"::text = ro.article_code::text;
