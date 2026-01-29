@echo off
REM Fix CSV export from Google Sheets and import to Supabase
REM Usage: fix-and-import-ro_stockwhs.bat "path\to\ro_stockwhs.csv"

REM Supabase Database Credentials
set DB_HOST=db.rwctwnzckyepiwcufdlw.supabase.co
set DB_PORT=5432
set DB_NAME=postgres
set DB_USER=postgres
set DB_PASSWORD=Database_2112!
set SCHEMA=branch_super_app_clawdbot
set TABLE=ro_stockwhs

REM Check if file provided
if "%~1"=="" (
    echo Usage: %0 "path\to\csv-file.csv"
    echo Example: %0 "ro_stockwhs (Rekapan Box - Mutasi Box WHS).csv"
    exit /b 1
)

set INPUT_FILE=%~1
set FILENAME=%~nx1
set FIXED_FILE=%TEMP%\fixed_%FILENAME%

echo ==========================================
echo RO StockWHS CSV Fix ^& Import Script
echo ==========================================
echo.

REM Check if file exists
if not exist "%INPUT_FILE%" (
    echo Error: File '%INPUT_FILE%' not found!
    exit /b 1
)

echo Input file: %INPUT_FILE%
echo Fixing CSV format...

REM Fix the CSV - remove wrapping quotes
REM Google Sheets exports with entire row quoted: "col1,col2,col3"
REM We need: col1,col2,col3
powershell -Command "Get-Content '%INPUT_FILE%' | ForEach-Object { $_ -replace '^\"' -replace '\"$' } | Set-Content '%FIXED_FILE%'"

echo CSV fixed: %FIXED_FILE%
echo.

REM Show first few lines of fixed file
echo Preview of fixed CSV (first 3 lines):
echo ------------------------------------------
head -3 "%FIXED_FILE%" 2>nul || powershell -Command "Get-Content '%FIXED_FILE%' -TotalCount 3"
echo ------------------------------------------
echo.

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: psql not found in PATH!
    echo Please install PostgreSQL client or add psql to PATH.
    del "%FIXED_FILE%"
    exit /b 1
)

REM Show current row count
echo Current row count:
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "SELECT COUNT(*) as current_rows FROM %SCHEMA%.%TABLE%;" 2>nul

echo.
echo WARNING: This will TRUNCATE the %SCHEMA%.%TABLE% table!
echo.
set /p CONFIRM="Continue with import? (yes/no): "

if /I not "%CONFIRM%"=="yes" (
    echo Import cancelled.
    del "%FIXED_FILE%"
    exit /b 0
)

echo.
echo Truncating table...
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "TRUNCATE TABLE %SCHEMA%.%TABLE%;" 2>nul

echo Importing data...
psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "\COPY %SCHEMA%.%TABLE% (no, kode_artikel, nama_artikel, tier, qty_box_ddd, qty_box_ljbb, qty_box_mbb, total, qty_pairs, tier_luxodev, status, wilbex_2026, accurate, \"%%\", \"31%%\", \"10%%\", \"8%%\", \"0%%\", \"0%%_1\", \"51%%\", \"100%%\", \"0%%_2\", \"100%%_2\") FROM '%FIXED_FILE%' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '');" 2>nul

if %ERRORLEVEL% equ 0 (
    echo.
    echo Import successful!
    echo New row count:
    psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -c "SELECT COUNT(*) as total_rows FROM %SCHEMA%.%TABLE%;" 2>nul
    echo.
    echo Done! Your ro_stockwhs table has been updated.
) else (
    echo.
    echo Import failed! Check the error messages above.
)

REM Cleanup
del "%FIXED_FILE%"
echo.
echo Cleaned up temporary files.

set PGPASSWORD=
