@echo off
echo ========================================
echo Starting Multi-Agent LLM Debate System
echo ========================================
echo.

REM Check if backend venv exists
if not exist "backend\v2" (
    echo [ERROR] Backend not set up! Run scripts\quick_start.bat first
    pause
    exit /b 1
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo [ERROR] Frontend not set up! Run scripts\quick_start.bat first
    pause
    exit /b 1
)

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && v2\Scripts\activate && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && yarn start"

echo.
echo ========================================
echo System Starting...
echo ========================================
echo.
echo Backend: http://localhost:8001
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8001/docs
echo.
echo Press any key to stop all servers...
pause >nul

echo.
echo Stopping servers...
taskkill /FI "WINDOWTITLE eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server*" /T /F >nul 2>&1

echo Servers stopped.
pause
