#!/bin/bash

# FinanceFlow Backend Startup Script
echo "🚀 Starting FinanceFlow Backend..."

# Change to backend directory
cd /Users/muhdhambal/FinanceFlow/backend

# Kill any existing process
echo "🔄 Stopping existing backend processes..."
pm2 stop financeflow-backend 2>/dev/null || true
pm2 delete financeflow-backend 2>/dev/null || true

# Build the project
echo "🔨 Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Start with PM2
echo "🎯 Starting backend with PM2..."
pm2 start ecosystem.config.js

# Show status
pm2 status

# Show logs
echo "📋 Backend logs:"
pm2 logs financeflow-backend --lines 10 --nostream

echo "✅ Backend started successfully!"
echo "🌐 Backend running at: http://localhost:3001"
echo "🏥 Health check: http://localhost:3001/api/health"
echo ""
echo "📊 To view logs: pm2 logs financeflow-backend"
echo "⏹️  To stop: pm2 stop financeflow-backend"
echo "🔄 To restart: pm2 restart financeflow-backend"