#!/bin/bash

# AutoServe Development Server Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting AutoServe Development Servers..."
echo ""

# Check if backend directory exists
if [ ! -d "mechanic/Mechanic-App" ]; then
    echo "❌ Backend directory not found at mechanic/Mechanic-App"
    exit 1
fi

# Start backend in background
echo "📦 Starting Backend (NestJS)..."
cd mechanic/Mechanic-App
npm run start:dev &
BACKEND_PID=$!
cd ../..

# Wait a bit for backend to start
sleep 5

# Start frontend
echo "🎨 Starting Frontend (Next.js)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servers starting..."
echo "📡 Backend: http://localhost:3000"
echo "🌐 Frontend: http://localhost:3001"
echo "📚 API Docs: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
