@echo off
setlocal
cd /d "%~dp0"

echo =============================================
echo Hong Kong Gem House Limited - Website Starter
echo =============================================

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 24 LTS, then reopen this file.
  echo Download: https://nodejs.org/en/download
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo npm was not found. Reinstall Node.js with npm included, then try again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing project dependencies. This needs an internet connection...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo Starting the development server...
call npm run dev
pause
