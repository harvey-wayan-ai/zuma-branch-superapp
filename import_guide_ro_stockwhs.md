# RO StockWHS Data Import - Step by Step Guide

## Overview
This guide explains how to clean and import ro_stockwhs data from Google Sheets to Supabase.

## Prerequisites
- Python 3.x installed
- `psycopg2` or `psycopg2-binary` package (for database import)
- Supabase database credentials

---

## Step 1: Export from Google Sheets

1. Open your Google Sheets file: "Rekapan Box - Mutasi Box WHS"
2. Go to **File** → **Download** → **Comma-separated values (.csv)**
3. Save the file (e.g., `ro_stockwhs.csv`)

**Note:** Google Sheets exports CSV with wrapping quotes around entire rows, which needs cleaning.

---

## Step 2: Clean the CSV

### Option A: Use the Python Script (Recommended)

Run the cleaning script:

```bash
python clean_ro_stockwhs.py
```

Or in JupyterLab:
```python
%run clean_ro_stockwhs.py
```

### Option B: Manual Steps

The CSV has these issues that need fixing:
1. **Wrapping quotes**: Each line is wrapped in quotes `"line content"`
2. **Double quotes**: Article names use `""` instead of `"`
3. **Embedded newlines**: Some article codes contain `\n` characters
4. **Missing column**: Header is missing the last column `100%_2`

---

## Step 3: Verify Cleaned CSV

Check that the cleaned CSV has:
- ✅ 23 columns in header
- ✅ 909 data rows
- ✅ No wrapping quotes
- ✅ Proper comma delimiters

---

## Step 4: Import to Supabase

### Option A: Using Python Script

```python
import psycopg2

# Database connection
conn = psycopg2.connect(
    host="db.rwctwnzckyepiwcufdlw.supabase.co",
    port="5432",
    database="postgres",
    user="postgres",
    password="Database_2112!"
)

cursor = conn.cursor()

# Truncate existing data
cursor.execute("TRUNCATE TABLE branch_super_app_clawdbot.ro_stockwhs;")
conn.commit()

# Import from CSV
with open('ro_stockwhs_clean.csv', 'r', encoding='utf-8') as f:
    cursor.copy_expert("""
        COPY branch_super_app_clawdbot.ro_stockwhs (
            row_num, kode_artikel, nama_artikel, tier, qty_box_ddd, 
            qty_box_ljbb, qty_box_mbb, total, qty_pairs, tier_luxodev, 
            status, wilbex_2026, accurate, "%", "31%", "10%", "8%", 
            "0%", "0%_1", "51%", "100%", "0%_2", "100%_2"
        ) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '');
    """, f)

conn.commit()

# Verify
cursor.execute("SELECT COUNT(*) FROM branch_super_app_clawdbot.ro_stockwhs;")
count = cursor.fetchone()[0]
print(f"Imported {count} rows successfully!")

cursor.close()
conn.close()
```

### Option B: Using Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Select `ro_stockwhs` table
3. Click **Import Data**
4. Upload the cleaned CSV file
5. Map columns if needed
6. Click **Import**

---

## Step 5: Verify Import

Run this SQL in Supabase SQL Editor:

```sql
SELECT COUNT(*) as total_rows FROM branch_super_app_clawdbot.ro_stockwhs;
-- Should return: 909

SELECT * FROM branch_super_app_clawdbot.ro_stockwhs LIMIT 5;
-- Should show first 5 rows
```

---

## Table Structure

The `ro_stockwhs` table has these columns:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-generated primary key |
| row_num | INTEGER | Row number from CSV |
| kode_artikel | VARCHAR(50) | Article code |
| nama_artikel | VARCHAR(255) | Article name |
| tier | INTEGER | Tier level |
| qty_box_ddd | INTEGER | QTY BOX DDD |
| qty_box_ljbb | INTEGER | QTY BOX LJBB |
| qty_box_mbb | INTEGER | QTY BOX MBB |
| total | INTEGER | Total quantity |
| qty_pairs | INTEGER | Quantity in pairs |
| tier_luxodev | VARCHAR(50) | Tier Luxodev |
| status | VARCHAR(50) | Status |
| wilbex_2026 | VARCHAR(50) | Wilbex 2026 |
| accurate | VARCHAR(50) | Accurate flag |
| % | VARCHAR(10) | Percentage column |
| 31% | VARCHAR(10) | 31% column |
| 10% | VARCHAR(10) | 10% column |
| 8% | VARCHAR(10) | 8% column |
| 0% | VARCHAR(10) | 0% column |
| 0%_1 | VARCHAR(10) | 0% column (duplicate) |
| 51% | VARCHAR(10) | 51% column |
| 100% | VARCHAR(10) | 100% column |
| 0%_2 | VARCHAR(10) | 0% column (triplicate) |
| 100%_2 | VARCHAR(10) | 100% column (duplicate) |
| created_at | TIMESTAMP | Auto-generated timestamp |

---

## Troubleshooting

### Issue: "parse error at end of line"
**Solution:** CSV has wrong column count. Use the Python script to fix it.

### Issue: "permission denied to COPY from a file"
**Solution:** Use STDIN method or Supabase Dashboard import.

### Issue: "invalid input syntax for type integer"
**Solution:** Check that numeric columns don't have text values. Clean CSV properly.

### Issue: Missing data after import
**Solution:** Check for embedded newlines in article names. The Python script handles this.

---

## Files Generated

1. **clean_ro_stockwhs.py** - Main cleaning script
2. **ro_stockwhs_clean.csv** - Cleaned output file
3. **IMPORT_GUIDE.md** - This documentation

---

## Notes

- Always backup data before truncating
- The `row_num` column was renamed from `no` to avoid PostgreSQL reserved word
- 3 rows had embedded newlines that were fixed during cleaning
- Total import time: ~2-3 seconds for 909 rows
