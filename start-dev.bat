@echo off
REM AutoServe Development Server Startup Script (Windows)
REM This script starts both backend and frontend servers

echo 🚀 Starting AutoServe Development Servers...
echo.

REM Check if backend directory exists
if not exist "mechanic\Mechanic-App" (
    echo ❌ Backend directory not found at mechanic\Mechanic-App
    pause
    exit /b 1
)

REM Start backend in new window
echo 📦 Starting Backend (NestJS)...
start "AutoServe Backend" cmd /k "cd mechanic\Mechanic-App && npm run start:dev"

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend in new window
echo 🎨 Starting Frontend (Next.js)...
start "AutoServe Frontend" cmd /k "npm run dev"

echo.
echo ✅ Servers starting in separate windows...
echo 📡 Backend: http://localhost:3000
echo 🌐 Frontend: http://localhost:3001
echo 📚 API Docs: http://localhost:3000/api
echo.
echo Close the windows to stop the servers
pause
