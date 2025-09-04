#!/bin/bash

# FinanceFlow System Startup Script
echo "🌟 Starting Complete FinanceFlow System..."
echo "================================"

# Function to check if a service is running
check_service() {
    local port=$1
    local service_name=$2
    
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "✅ $service_name is running on port $port"
        return 0
    else
        echo "❌ $service_name is not running on port $port"
        return 1
    fi
}

# Check PostgreSQL
echo "🗄️  Checking PostgreSQL..."
if ! pg_isready > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start it first:"
    echo "   brew services start postgresql@14"
    exit 1
fi
echo "✅ PostgreSQL is running"

# Start Backend
echo ""
echo "🔧 Starting Backend..."
./start-backend.sh

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! check_service 3001 "Backend API"; then
    echo "❌ Backend failed to start!"
    exit 1
fi

# Test backend health
echo "🏥 Testing backend health..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Start Frontend
echo ""
echo "🎨 Starting Frontend..."
cd /Users/muhdhambal/FinanceFlow/frontend

# Kill any existing frontend processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start frontend in background
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 10

# Check if frontend is running
if ! check_service 3000 "Frontend"; then
    echo "❌ Frontend failed to start!"
    exit 1
fi

echo ""
echo "🎉 FinanceFlow System Started Successfully!"
echo "================================"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo "🏥 Health:   http://localhost:3001/api/health"
echo ""
echo "📊 Commands:"
echo "   pm2 logs financeflow-backend  # View backend logs"
echo "   tail -f frontend.log          # View frontend logs"
echo "   pm2 stop financeflow-backend  # Stop backend"
echo "   kill $FRONTEND_PID             # Stop frontend"
echo ""
echo "🦊 Firefox should open automatically!"
echo "Press Ctrl+C to stop the system"

# Keep script alive
wait $FRONTEND_PID