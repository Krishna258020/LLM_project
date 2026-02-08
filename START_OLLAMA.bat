@echo off
echo ========================================
echo Starting Ollama
echo ========================================
echo.

echo Checking if Ollama is installed...
where ollama >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Ollama not found!
    echo.
    echo Please install Ollama from: https://ollama.ai
    echo.
    pause
    exit /b 1
)

echo [OK] Ollama is installed
echo.

echo Starting Ollama server...
start "Ollama Server" cmd /k "ollama serve"

echo.
echo Waiting for Ollama to start...
timeout /t 3 /nobreak >nul

echo.
echo Checking if Ollama is running...
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Ollama may still be starting...
    echo Wait a few more seconds and check manually
) else (
    echo [OK] Ollama is running!
)

echo.
echo Checking installed models...
ollama list

echo.
echo ========================================
echo Ollama Status
echo ========================================
echo.
echo If you see models listed above, Ollama is ready!
echo.
echo Required models:
echo - mistral
echo - phi3
echo - llama3.1
echo.
echo If any are missing, run:
echo   ollama pull mistral
echo   ollama pull phi3
echo   ollama pull llama3.1
echo.
pause
