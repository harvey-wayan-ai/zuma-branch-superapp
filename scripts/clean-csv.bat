@echo off
REM Clean CSV export from Google Sheets
REM Removes wrapping quotes and saves clean version
REM Usage: clean-csv.bat "path\to\input.csv"

REM Check if file provided
if "%~1"=="" (
    echo Usage: %0 "path\to\csv-file.csv"
    echo Example: %0 "ro_stockwhs.csv"
    exit /b 1
)

set INPUT_FILE=%~1
set FILENAME=%~n1
set EXT=%~x1
set OUTPUT_FILE=%~dp1%FILENAME%_clean%EXT%

echo ==========================================
echo CSV Cleaner for Google Sheets Export
echo ==========================================
echo.

REM Check if file exists
if not exist "%INPUT_FILE%" (
    echo Error: File '%INPUT_FILE%' not found!
    exit /b 1
)

echo Input file: %INPUT_FILE%
echo Output file: %OUTPUT_FILE%
echo.
echo Cleaning CSV format...

REM Fix the CSV - remove wrapping quotes from each line
REM Google Sheets exports with entire row quoted: "col1,col2,col3"
REM We need: col1,col2,col3
powershell -Command "Get-Content '%INPUT_FILE%' -Encoding UTF8 | ForEach-Object { $_ -replace '^\"' -replace '\"$' } | Set-Content '%OUTPUT_FILE%' -Encoding UTF8"

if %ERRORLEVEL% equ 0 (
    echo.
    echo SUCCESS! Clean CSV created.
    echo.
    echo Preview of cleaned CSV (first 5 lines):
    echo ------------------------------------------
    powershell -Command "Get-Content '%OUTPUT_FILE%' -TotalCount 5"
    echo ------------------------------------------
    echo.
    echo File saved to: %OUTPUT_FILE%
    echo.
    echo You can now upload this file to Supabase manually.
) else (
    echo.
    echo ERROR: Failed to clean CSV!
    exit /b 1
)
