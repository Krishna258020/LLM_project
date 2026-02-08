@echo off
echo ========================================
echo Complete System Setup
echo ========================================
echo.

echo This will:
echo 1. Create Python 3.11 virtual environment for backend
echo 2. Install backend dependencies
echo 3. Install frontend dependencies with yarn
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo ========================================
echo Step 1: Backend Setup
echo ========================================
call setup_backend.bat

echo.
echo ========================================
echo Step 2: Frontend Setup
echo ========================================
call setup_frontend.bat

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure Ollama is running: ollama serve
echo 2. Pull models: ollama pull mistral && ollama pull phi3 && ollama pull llama3.1
echo 3. Start MongoDB: docker run -d -p 27017:27017 --name mongodb mongo
echo 4. Start system: .\start_system.bat
echo.
pause
