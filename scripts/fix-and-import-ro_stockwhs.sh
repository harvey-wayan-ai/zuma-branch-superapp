#!/bin/bash
# Fix CSV export from Google Sheets and import to Supabase
# Usage: ./fix-and-import-ro_stockwhs.sh <csv-file>

# Supabase Database Credentials
DB_HOST="db.rwctwnzckyepiwcufdlw.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="Database_2112!"
SCHEMA="branch_super_app_clawdbot"
TABLE="ro_stockwhs"

# Check if file provided
if [ -z "$1" ]; then
    echo "Usage: $0 <csv-file>"
    echo "Example: $0 'ro_stockwhs (Rekapan Box - Mutasi Box WHS).csv'"
    exit 1
fi

INPUT_FILE="$1"
FILENAME=$(basename "$INPUT_FILE")
FIXED_FILE="/tmp/fixed_${FILENAME}"

echo "=========================================="
echo "RO StockWHS CSV Fix & Import Script"
echo "=========================================="
echo ""

# Check if file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: File '$INPUT_FILE' not found!"
    exit 1
fi

echo "📁 Input file: $INPUT_FILE"
echo "🔧 Fixing CSV format..."

# Fix the CSV - remove wrapping quotes and ensure proper format
# Google Sheets exports with entire row quoted: "col1,col2,col3"
# We need: col1,col2,col3
awk '{
    # Remove leading and trailing quotes
    gsub(/^"/, "")
    gsub(/"$/, "")
    print
}' "$INPUT_FILE" > "$FIXED_FILE"

echo "✅ CSV fixed: $FIXED_FILE"
echo ""

# Show first few lines of fixed file
echo "📋 Preview of fixed CSV (first 3 lines):"
echo "------------------------------------------"
head -3 "$FIXED_FILE"
echo "------------------------------------------"
echo ""

# Confirm before truncating
echo "⚠️  WARNING: This will TRUNCATE the $SCHEMA.$TABLE table!"
echo "📊 Current row count:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "SELECT COUNT(*) as current_rows FROM $SCHEMA.$TABLE;" 2>/dev/null

echo ""
read -p "Continue with import? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Import cancelled."
    rm "$FIXED_FILE"
    exit 0
fi

echo ""
echo "🗑️  Truncating table..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "TRUNCATE TABLE $SCHEMA.$TABLE;" 2>/dev/null

echo "📥 Importing data..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" <<EOF
\COPY $SCHEMA.$TABLE (
    no,
    kode_artikel,
    nama_artikel,
    tier,
    qty_box_ddd,
    qty_box_ljbb,
    qty_box_mbb,
    total,
    qty_pairs,
    tier_luxodev,
    status,
    wilbex_2026,
    accurate,
    "%",
    "31%",
    "10%",
    "8%",
    "0%",
    "0%_1",
    "51%",
    "100%",
    "0%_2",
    "100%_2"
) FROM '$FIXED_FILE' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '');
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Import successful!"
    echo "📊 New row count:"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "SELECT COUNT(*) as total_rows FROM $SCHEMA.$TABLE;" 2>/dev/null
    echo ""
    echo "🎉 Done! Your ro_stockwhs table has been updated."
else
    echo ""
    echo "❌ Import failed! Check the error messages above."
fi

# Cleanup
rm "$FIXED_FILE"
echo ""
echo "🧹 Cleaned up temporary files."
