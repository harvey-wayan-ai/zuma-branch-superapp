#!/bin/bash
# Import RO Recommendations data with semicolon delimiter
# Usage: ./import-ro-recommendations.sh <csv-file>

DB_HOST="db.rwctwnzckyepiwcufdlw.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="Database_2112!"
SCHEMA="branch_super_app_clawdbot"
TABLE="ro_recommendations"

if [ -z "$1" ]; then
    echo "Usage: $0 <csv-file>"
    echo "CSV format (semicolon delimiter):"
    echo 'Store Name;Article Mix;Gender;Series;Article;Tier;Total Recommendation;Recommendation (box);kode kecil;ASSRT STATUS;BROKEN SIZE'
    exit 1
fi

CSV_FILE="$1"

# Check if file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "Error: File '$CSV_FILE' not found!"
    exit 1
fi

echo "Importing data from: $CSV_FILE"
echo "Target table: $SCHEMA.$TABLE"
echo ""

# Create temp table with proper column mapping
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" <<EOF
-- Create temp table
DROP TABLE IF EXISTS temp_ro_recommendations;
CREATE TEMP TABLE temp_ro_recommendations (
    store_name VARCHAR(255),
    article_mix VARCHAR(50),
    gender VARCHAR(50),
    series VARCHAR(100),
    article VARCHAR(255),
    tier INTEGER,
    total_recommendation INTEGER,
    recommendation_box INTEGER,
    kode_kecil INTEGER,
    assay_status VARCHAR(50),
    broken_size VARCHAR(255)
);

-- Copy data from CSV with semicolon delimiter
\COPY temp_ro_recommendations (store_name, article_mix, gender, series, article, tier, total_recommendation, recommendation_box, kode_kecil, assay_status, broken_size) 
FROM '$CSV_FILE' 
WITH (FORMAT csv, DELIMITER ';', HEADER true, NULL '');

-- Insert into actual table with proper column mapping
INSERT INTO $SCHEMA.$TABLE (
    "Store Name",
    "Article Mix",
    "Gender",
    "Series",
    "Article",
    "Tier",
    "Total Recommendation",
    "Recommendation (box)",
    "kode kecil",
    "ASSRT STATUS",
    "BROKEN SIZE"
)
SELECT 
    store_name,
    article_mix,
    gender,
    series,
    article,
    tier,
    total_recommendation,
    recommendation_box,
    kode_kecil,
    assay_status,
    broken_size
FROM temp_ro_recommendations;

-- Clean up
DROP TABLE IF EXISTS temp_ro_recommendations;

-- Show results
SELECT COUNT(*) as total_rows FROM $SCHEMA.$TABLE;
EOF

echo ""
echo "Import completed!"
