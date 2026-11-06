@echo off
title ASCEND // JARVIS DESKTOP LAUNCHER
color 0B
cls

echo ===============================================================================
echo            ASCEND // JARVIS AI SYSTEM - ONE-CLICK LAUNCHER
echo ===============================================================================
echo.

set "ASCEND_ROOT=%~dp0"
set "BACKEND_DIR=%ASCEND_ROOT%backend"
set "FRONTEND_DIR=%ASCEND_ROOT%frontend"
set "PYTHON_EXE=%BACKEND_DIR%\venv\Scripts\python.exe"

echo [1/3] Verifying Python backend virtual environment...
if not exist "%PYTHON_EXE%" (
    echo ERROR: Python virtual environment not found at %PYTHON_EXE%
    echo Please ensure backend venv is configured.
    pause
    exit /b 1
)

echo [2/3] Checking frontend node modules...
if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing node dependencies for ASCEND desktop...
    cd /d "%FRONTEND_DIR%"
    call npm install
)

echo [3/3] Launching ASCEND Desktop Application...
echo        - Supervising Python Backend (127.0.0.1:8000)
echo        - Supervising Next.js Desktop Core (127.0.0.1:3000)
echo        - Connecting Holographic JARVIS Companion
echo.

cd /d "%FRONTEND_DIR%"
call node_modules\.bin\electron.cmd ./desktop/main.js

echo.
echo ASCEND has closed.
