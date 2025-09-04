#!/bin/bash

# FinanceFlow System Control Script

case "$1" in
    start)
        echo "🚀 Starting FinanceFlow system..."
        echo "Opening backend in new terminal..."
        osascript -e 'tell app "Terminal" to do script "cd /Users/muhdhambal/FinanceFlow/backend && npm run dev"'
        sleep 3
        echo "Opening frontend in new terminal..."
        osascript -e 'tell app "Terminal" to do script "cd /Users/muhdhambal/FinanceFlow/frontend && npm start"'
        echo "✅ System starting... Check the new terminal windows!"
        ;;
    stop)
        echo "🛑 Stopping FinanceFlow system..."
        ./stop_system.sh
        ;;
    restart)
        echo "🔄 Restarting FinanceFlow system..."
        ./stop_system.sh
        sleep 2
        $0 start
        ;;
    status)
        echo "📊 FinanceFlow System Status:"
        echo ""
        echo "Backend (port 5000):"
        if lsof -i :5000 > /dev/null; then
            echo "  ✅ Running"
            lsof -i :5000
        else
            echo "  ❌ Not running"
        fi
        echo ""
        echo "Frontend (port 3000):"
        if lsof -i :3000 > /dev/null; then
            echo "  ✅ Running"
            lsof -i :3000
        else
            echo "  ❌ Not running"
        fi
        ;;
    *)
        echo "FinanceFlow System Control"
        echo ""
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start both backend and frontend"
        echo "  stop    - Stop both services"
        echo "  restart - Stop and start services"
        echo "  status  - Check if services are running"
        echo ""
        echo "Manual commands:"
        echo "  Backend:  cd backend && npm run dev"
        echo "  Frontend: cd frontend && npm start"
        exit 1
        ;;
esac