#!/bin/bash

echo "🛑 Stopping FinanceFlow system..."

# Function to kill process by port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill $pid
        sleep 2
        # Force kill if still running
        if lsof -ti:$port > /dev/null; then
            echo "Force killing process on port $port"
            kill -9 $pid
        fi
    else
        echo "No process running on port $port"
    fi
}

# Stop backend (port 5000)
echo "🔴 Stopping backend server (port 5000)..."
kill_port 5000

# Stop frontend (port 3000)
echo "🔴 Stopping frontend server (port 3000)..."
kill_port 3000

echo "✅ FinanceFlow system stopped successfully!"
echo ""
echo "To restart the system:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm start"