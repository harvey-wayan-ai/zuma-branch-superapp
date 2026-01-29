"""
RO StockWHS CSV Cleaner and Importer
=====================================

This script cleans Google Sheets CSV export and imports to Supabase.
Can be run standalone or in JupyterLab.

Usage:
    python clean_ro_stockwhs.py
    
Or in JupyterLab:
    %run clean_ro_stockwhs.py
    
Requirements:
    pip install psycopg2-binary pandas
"""

import csv
import os
from io import StringIO
from pathlib import Path

# ============================================================
# CONFIGURATION - EDIT THESE PATHS
# ============================================================

# Input: Path to your downloaded CSV from Google Sheets
INPUT_CSV_PATH = "/root/clawd/harvey-projects/zuma-ro-pwa/data/ro_stockwhs (Rekapan Box - Mutasi Box WHS).csv"

# Output: Path where cleaned CSV will be saved
OUTPUT_CSV_PATH = "/tmp/ro_stockwhs_clean.csv"

# Alternative: Use relative paths for local development
# INPUT_CSV_PATH = "./data/ro_stockwhs.csv"
# OUTPUT_CSV_PATH = "./data/ro_stockwhs_clean.csv"

# ============================================================
# SUPABASE CONFIGURATION (for automatic import)
# ============================================================

SUPABASE_HOST = "db.rwctwnzckyepiwcufdlw.supabase.co"
SUPABASE_PORT = "5432"
SUPABASE_DB = "postgres"
SUPABASE_USER = "postgres"
SUPABASE_PASSWORD = "Database_2112!"
SUPABASE_SCHEMA = "branch_super_app_clawdbot"
SUPABASE_TABLE = "ro_stockwhs"

# ============================================================
# STEP 1: CLEAN THE CSV
# ============================================================

def clean_csv(input_path, output_path):
    """
    Clean Google Sheets CSV export.
    
    Fixes:
    1. Removes wrapping quotes from each line
    2. Fixes double quotes ("") to single quotes (")
    3. Handles embedded newlines in article codes
    4. Ensures consistent column count (23 columns)
    """
    
    print("=" * 60)
    print("STEP 1: Cleaning CSV")
    print("=" * 60)
    print(f"Input: {input_path}")
    print(f"Output: {output_path}")
    print()
    
    # Check if input file exists
    if not os.path.exists(input_path):
        print(f"❌ Error: Input file not found: {input_path}")
        return None
    
    # Read raw content
    print("Reading CSV file...")
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by lines and clean
    lines = content.strip().split('\n')
    print(f"Total lines in file: {len(lines)}")
    
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        # Remove wrapping quotes
        if line.startswith('"') and line.endswith('"'):
            line = line[1:-1]
        # Replace double quotes with single
        line = line.replace('""', '"')
        cleaned_lines.append(line)
    
    # Join back and parse as CSV
    csv_content = '\n'.join(cleaned_lines)
    
    print("Parsing CSV...")
    reader = csv.reader(StringIO(csv_content))
    rows = list(reader)
    
    print(f"Total rows parsed: {len(rows)}")
    print(f"Header columns: {len(rows[0])}")
    
    # Fix rows with embedded newlines
    fixed_rows = []
    bad_rows = []
    
    for i, row in enumerate(rows):
        if i == 0:
            # Header - ensure 23 columns
            if len(row) == 22:
                row.append('100%_2')  # Add missing column
            elif len(row) > 23:
                row = row[:23]
            fixed_rows.append(row)
        else:
            # Data rows
            original_len = len(row)
            
            # Fix embedded newlines in kode_artikel (column 1)
            if len(row) > 1 and '\n' in row[1]:
                parts = row[1].split('\n')
                if len(parts) == 2:
                    row[1] = parts[0]
                    # Reconstruct row
                    remaining = parts[1] + ',' + ','.join(row[2:])
                    remaining_parts = remaining.split(',')
                    
                    # Find where nama_artikel ends (contains commas)
                    nama_parts = []
                    idx = 0
                    for j, part in enumerate(remaining_parts):
                        # Check if this looks like a number (tier column)
                        if part.strip().isdigit() or (part.strip().startswith('-') and part.strip()[1:].isdigit()):
                            idx = j
                            break
                        nama_parts.append(part)
                    
                    nama_artikel = ','.join(nama_parts)
                    new_row = [row[0], row[1], nama_artikel]
                    new_row.extend(remaining_parts[idx:])
                    row = new_row
            
            # Ensure exactly 23 columns
            while len(row) < 23:
                row.append('')
            row = row[:23]
            
            if original_len != 23:
                bad_rows.append((i, original_len, len(row)))
            
            fixed_rows.append(row)
    
    if bad_rows:
        print(f"⚠️  Fixed {len(bad_rows)} rows with column issues")
        for row_num, old_count, new_count in bad_rows[:3]:
            print(f"   Row {row_num}: {old_count} → {new_count} columns")
    
    # Verify all rows have 23 columns
    all_valid = all(len(row) == 23 for row in fixed_rows)
    print(f"✅ All rows have 23 columns: {all_valid}")
    
    # Write final CSV
    print(f"Writing cleaned CSV to: {output_path}")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        writer.writerows(fixed_rows)
    
    print(f"✅ Cleaned CSV saved: {output_path}")
    print(f"   Total rows: {len(fixed_rows)} (including header)")
    print()
    
    return output_path

# ============================================================
# STEP 2: IMPORT TO SUPABASE (Optional)
# ============================================================

def import_to_supabase(csv_path):
    """
    Import cleaned CSV to Supabase.
    Requires psycopg2: pip install psycopg2-binary
    """
    
    print("=" * 60)
    print("STEP 2: Importing to Supabase")
    print("=" * 60)
    
    try:
        import psycopg2
    except ImportError:
        print("❌ Error: psycopg2 not installed")
        print("   Run: pip install psycopg2-binary")
        return False
    
    print(f"Connecting to Supabase...")
    
    try:
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            port=SUPABASE_PORT,
            database=SUPABASE_DB,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD
        )
        cursor = conn.cursor()
        
        # Truncate existing data
        print("Truncating existing data...")
        cursor.execute(f"TRUNCATE TABLE {SUPABASE_SCHEMA}.{SUPABASE_TABLE};")
        conn.commit()
        
        # Import from CSV
        print("Importing data...")
        with open(csv_path, 'r', encoding='utf-8') as f:
            cursor.copy_expert(f"""
                COPY {SUPABASE_SCHEMA}.{SUPABASE_TABLE} (
                    row_num, kode_artikel, nama_artikel, tier, qty_box_ddd, 
                    qty_box_ljbb, qty_box_mbb, total, qty_pairs, tier_luxodev, 
                    status, wilbex_2026, accurate, "%", "31%", "10%", "8%", 
                    "0%", "0%_1", "51%", "100%", "0%_2", "100%_2"
                ) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '');
            """, f)
        
        conn.commit()
        
        # Verify
        cursor.execute(f"SELECT COUNT(*) FROM {SUPABASE_SCHEMA}.{SUPABASE_TABLE};")
        count = cursor.fetchone()[0]
        print(f"✅ Imported {count} rows successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

# ============================================================
# MAIN EXECUTION
# ============================================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("RO StockWHS CSV Cleaner and Importer")
    print("=" * 60 + "\n")
    
    # Step 1: Clean CSV
    cleaned_path = clean_csv(INPUT_CSV_PATH, OUTPUT_CSV_PATH)
    
    if cleaned_path:
        print("✅ CSV cleaning completed!")
        print()
        
        # Ask if user wants to import
        response = input("Do you want to import to Supabase? (yes/no): ").strip().lower()
        
        if response == 'yes':
            success = import_to_supabase(cleaned_path)
            if success:
                print("\n🎉 All done! Data imported successfully.")
            else:
                print("\n⚠️  Import failed. You can import manually via Supabase Dashboard.")
        else:
            print(f"\n✅ Cleaned CSV saved at: {cleaned_path}")
            print("You can import this file manually via Supabase Dashboard.")
    else:
        print("\n❌ CSV cleaning failed. Please check the input file path.")
