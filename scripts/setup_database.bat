@echo off
echo ========================================
echo Database Setup Script
echo ========================================
echo.
echo This script will:
echo 1. Create the debate_database
echo 2. Create all required tables
echo 3. Seed default templates
echo.
echo Make sure XAMPP MySQL is running!
echo.
pause

echo.
echo Creating database and tables...
echo.

mysql -u root -e "CREATE DATABASE IF NOT EXISTS debate_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create database!
    echo Make sure MySQL is running in XAMPP.
    echo.
    pause
    exit /b 1
)

echo Database created successfully!
echo.
echo Creating tables...
echo.

mysql -u root debate_database < "%~dp0..\backend\init_database.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create tables!
    echo Check the SQL file for errors.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Database: debate_database
echo Tables created:
echo   - debates
echo   - status_checks
echo   - users
echo   - templates
echo.
echo Default templates will be seeded when you start the backend.
echo.
echo Next steps:
echo 1. Start the backend: .\scripts\restart_backend.bat
echo 2. Start the frontend: cd frontend ^&^& yarn start
echo.
pause
