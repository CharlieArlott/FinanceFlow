#!/bin/bash

# FinanceFlow Frontend Startup Script
echo "🚀 Starting FinanceFlow Frontend..."

# Change to frontend directory
cd /Users/muhdhambal/FinanceFlow/frontend

# Kill any existing processes on port 3000
echo "🔄 Stopping existing frontend processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait a moment for port to be freed
sleep 2

# Start frontend
echo "🎯 Starting frontend with npm..."
echo "🦊 Opening in Firefox..."

# Start in background and capture PID
npm start &
FRONTEND_PID=$!

echo "✅ Frontend started successfully!"
echo "🌐 Frontend running at: http://localhost:3000"
echo "🔄 Process ID: $FRONTEND_PID"
echo ""
echo "⏹️  To stop: kill $FRONTEND_PID or Ctrl+C"

# Keep script alive to show logs
wait $FRONTEND_PID