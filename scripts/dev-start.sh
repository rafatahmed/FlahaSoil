#!/bin/bash
# filepath: C:\Users\rafat\repo\Flaha\FlahaSoil\scripts\dev-start.sh

# Development start script with auto-restart
echo "Starting FlahaSoil in development mode..."

# Check if we're in the scripts directory and navigate up if needed
if [[ $(basename "$PWD") == "scripts" ]]; then
    cd ..
fi

# Install nodemon if not present
if ! command -v nodemon &> /dev/null; then
    echo "Installing nodemon for auto-restart..."
    npm install -g nodemon
fi

# Start backend with nodemon for auto-restart
cd api-implementation
echo "Starting backend with auto-restart..."
nodemon server.js &
BACKEND_PID=$!

# Start frontend
cd ../public
echo "Starting frontend server..."
if command -v python3 &> /dev/null; then
    python3 -m http.server 3000 &
elif command -v python &> /dev/null; then
    python -m http.server 3000 &
else
    npx serve -p 3000 &
fi
FRONTEND_PID=$!

echo ""
echo "Development servers started!"
echo "Backend PID: $BACKEND_PID (auto-restart enabled)"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  Health:   http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait