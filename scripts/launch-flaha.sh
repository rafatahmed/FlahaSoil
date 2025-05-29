#!/bin/bash
# filepath: C:\Users\rafat\repo\Flaha\FlahaSoil\scripts\launch-flaha.sh

# FlahaSoil Application Launcher
# This script launches both frontend and backend servers with monitoring

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001
PROJECT_NAME="FlahaSoil"
LOG_DIR="../logs"
FRONTEND_DIR="../public"
BACKEND_DIR="../api-implementation"

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if netstat -an | grep ":$port " | grep -q LISTEN; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port (Windows compatible)
kill_port() {
    local port=$1
    print_warning "Checking for processes on port $port..."
    
    # For Windows (using netstat and taskkill)
    if command -v taskkill &> /dev/null; then
        local pids=$(netstat -ano | grep ":$port " | grep LISTENING | awk '{print $5}' | sort -u)
        for pid in $pids; do
            if [ ! -z "$pid" ] && [ "$pid" != "0" ]; then
                print_warning "Killing process on port $port (PID: $pid)"
                taskkill //PID $pid //F 2>/dev/null || true
            fi
        done
    else
        # For Unix-like systems
        local pid=$(lsof -ti :$port 2>/dev/null || netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1)
        if [ ! -z "$pid" ]; then
            print_warning "Killing process on port $port (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
        fi
    fi
    sleep 2
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        print_info "Download from: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "Node.js version: $(node --version)"
    print_status "npm version: $(npm --version)"
    
    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory '$BACKEND_DIR' not found!"
        print_info "Make sure you're running this script from the FlahaSoil root directory"
        exit 1
    fi
    
    # Check if frontend directory exists
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory '$FRONTEND_DIR' not found!"
        print_info "Make sure you're running this script from the FlahaSoil root directory"
        exit 1
    fi
    
    # Check if backend package.json exists
    if [ ! -f "$BACKEND_DIR/package.json" ]; then
        print_error "Backend package.json not found in '$BACKEND_DIR'!"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_info "Installing/updating dependencies..."
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
    cd - > /dev/null
    
    print_status "Dependencies installed successfully!"
}

# Function to start backend server
start_backend() {
    print_info "Starting backend server..."
    
    # Kill any existing process on backend port
    if check_port $BACKEND_PORT; then
        print_warning "Port $BACKEND_PORT is already in use"
        kill_port $BACKEND_PORT
    fi
    
    cd "$BACKEND_DIR"
    
    # Start backend server in background
    print_status "Launching backend server on port $BACKEND_PORT..."
    
    # For Windows, use start command
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        start /B node server.js > "../$LOG_DIR/backend.log" 2>&1
        # Get the PID in a Windows-compatible way
        sleep 2
        local backend_pids=$(tasklist //FI "IMAGENAME eq node.exe" //FO CSV | grep node.exe | cut -d',' -f2 | tr -d '"')
        BACKEND_PID=$(echo $backend_pids | cut -d' ' -f1)
    else
        nohup node server.js > "../$LOG_DIR/backend.log" 2>&1 &
        BACKEND_PID=$!
    fi
    
    echo $BACKEND_PID > "../$LOG_DIR/backend.pid"
    cd - > /dev/null
    
    # Wait for backend to start
    print_info "Waiting for backend server to start..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if check_port $BACKEND_PORT; then
            print_status "Backend server started successfully on port $BACKEND_PORT (PID: $BACKEND_PID)"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
        echo -n "."
    done
    
    print_error "Backend server failed to start within 30 seconds"
    return 1
}

# Function to start frontend server
start_frontend() {
    print_info "Starting frontend server..."
    
    # Kill any existing process on frontend port
    if check_port $FRONTEND_PORT; then
        print_warning "Port $FRONTEND_PORT is already in use"
        kill_port $FRONTEND_PORT
    fi
    
    # Start simple HTTP server for frontend
    print_status "Launching frontend server on port $FRONTEND_PORT..."
    
    cd "$FRONTEND_DIR"
    
    # Check available HTTP servers and start accordingly
    if command -v python &> /dev/null; then
        # For Windows, use start command
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
            start /B python -m http.server $FRONTEND_PORT > "../$LOG_DIR/frontend.log" 2>&1
            sleep 2
            local frontend_pids=$(tasklist //FI "IMAGENAME eq python.exe" //FO CSV | grep python.exe | cut -d',' -f2 | tr -d '"')
            FRONTEND_PID=$(echo $frontend_pids | cut -d' ' -f1)
        else
            nohup python -m http.server $FRONTEND_PORT > "../$LOG_DIR/frontend.log" 2>&1 &
            FRONTEND_PID=$!
        fi
    elif command -v python3 &> /dev/null; then
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
            start /B python3 -m http.server $FRONTEND_PORT > "../$LOG_DIR/frontend.log" 2>&1
            sleep 2
            local frontend_pids=$(tasklist //FI "IMAGENAME eq python.exe" //FO CSV | grep python.exe | cut -d',' -f2 | tr -d '"')
            FRONTEND_PID=$(echo $frontend_pids | cut -d' ' -f1)
        else
            nohup python3 -m http.server $FRONTEND_PORT > "../$LOG_DIR/frontend.log" 2>&1 &
            FRONTEND_PID=$!
        fi
    elif command -v npx &> /dev/null; then
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
            start /B npx serve -p $FRONTEND_PORT > "../$LOG_DIR/frontend.log" 2>&1
            sleep 2
            local frontend_pids=$(tasklist //FI "IMAGENAME eq node.exe" //FO CSV | grep node.exe | cut -d',' -f2 | tr -d '"')
            FRONTEND_PID=$(echo $frontend_pids | tail -1)
        else
            nohup npx serve -p $FRONTEND_PORT > "../$LOG_DIR/frontend.log" 2>&1 &
            FRONTEND_PID=$!
        fi
    else
        print_error "No suitable HTTP server found!"
        print_info "Please install one of the following:"
        print_info "  - Python: https://www.python.org/downloads/"
        print_info "  - serve: npm install -g serve"
        return 1
    fi
    
    echo $FRONTEND_PID > "../$LOG_DIR/frontend.pid"
    cd - > /dev/null
    
    # Wait for frontend to start
    print_info "Waiting for frontend server to start..."
    local attempts=0
    local max_attempts=15
    
    while [ $attempts -lt $max_attempts ]; do
        if check_port $FRONTEND_PORT; then
            print_status "Frontend server started successfully on port $FRONTEND_PORT (PID: $FRONTEND_PID)"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
        echo -n "."
    done
    
    print_error "Frontend server failed to start within 15 seconds"
    return 1
}

# Function to test API connection
test_api() {
    print_info "Testing API connection..."
    
    local health_url="http://localhost:$BACKEND_PORT/health"
    local attempts=0
    local max_attempts=10
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s "$health_url" > /dev/null 2>&1; then
            print_status "API health check passed!"
            local response=$(curl -s "$health_url")
            print_info "API Response: $response"
            return 0
        elif command -v powershell &> /dev/null; then
            # Windows alternative using PowerShell
            if powershell -Command "try { Invoke-RestMethod -Uri '$health_url' -TimeoutSec 5 } catch { exit 1 }" > /dev/null 2>&1; then
                print_status "API health check passed!"
                return 0
            fi
        fi
        sleep 2
        attempts=$((attempts + 1))
        print_info "Attempt $attempts/$max_attempts: Waiting for API..."
    done
    
    print_error "API health check failed after $max_attempts attempts"
    return 1
}

# Function to display server status
show_status() {
    echo
    echo -e "${PURPLE}╔════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║          ${PROJECT_NAME} Server Status          ║${NC}"
    echo -e "${PURPLE}╠════════════════════════════════════════╣${NC}"
    
    # Backend status
    if check_port $BACKEND_PORT; then
        echo -e "${PURPLE}║${NC} Backend:  ${GREEN}✓ Running${NC} on port ${CYAN}$BACKEND_PORT${NC}    ${PURPLE}║${NC}"
    else
        echo -e "${PURPLE}║${NC} Backend:  ${RED}✗ Stopped${NC}                  ${PURPLE}║${NC}"
    fi
    
    # Frontend status
    if check_port $FRONTEND_PORT; then
        echo -e "${PURPLE}║${NC} Frontend: ${GREEN}✓ Running${NC} on port ${CYAN}$FRONTEND_PORT${NC}    ${PURPLE}║${NC}"
    else
        echo -e "${PURPLE}║${NC} Frontend: ${RED}✗ Stopped${NC}                  ${PURPLE}║${NC}"
    fi
    
    echo -e "${PURPLE}╠════════════════════════════════════════╣${NC}"
    echo -e "${PURPLE}║${NC} Frontend URL: ${CYAN}http://localhost:$FRONTEND_PORT${NC} ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC} API URL:      ${CYAN}http://localhost:$BACKEND_PORT${NC}  ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC} Health Check: ${CYAN}http://localhost:$BACKEND_PORT/health${NC} ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════╝${NC}"
    echo
}

# Function to monitor servers
monitor_servers() {
    print_info "Starting server monitoring... (Press Ctrl+C to stop)"
    echo
    
    while true; do
        # Clear screen and show status
        clear
        echo -e "${CYAN}${PROJECT_NAME} Server Monitor${NC}"
        echo -e "${CYAN}$(date)${NC}"
        echo "════════════════════════════════════════"
        
        show_status
        
        # Show recent logs
        echo -e "${YELLOW}Recent Backend Logs:${NC}"
        if [ -f "$LOG_DIR/backend.log" ]; then
            tail -n 5 "$LOG_DIR/backend.log" 2>/dev/null || echo "No backend logs yet"
        else
            echo "No backend logs yet"
        fi
        
        echo
        echo -e "${YELLOW}Recent Frontend Logs:${NC}"
        if [ -f "$LOG_DIR/frontend.log" ]; then
            tail -n 3 "$LOG_DIR/frontend.log" 2>/dev/null || echo "No frontend logs yet"
        else
            echo "No frontend logs yet"
        fi
        
        echo
        echo "Press 'q' to quit monitoring, 'r' to restart servers, 's' to show full status"
        echo "Monitoring... (refreshing every 10 seconds)"
        
        # Wait for input or timeout
        read -t 10 -n 1 input 2>/dev/null || true
        
        case $input in
            q|Q)
                print_info "Stopping monitoring..."
                break
                ;;
            r|R)
                print_info "Restarting servers..."
                stop_servers
                sleep 2
                start_all_servers
                ;;
            s|S)
                show_detailed_status
                read -p "Press Enter to continue..."
                ;;
        esac
    done
}

# Function to show detailed status
show_detailed_status() {
    clear
    echo -e "${CYAN}${PROJECT_NAME} Detailed Status${NC}"
    echo "════════════════════════════════════════"
    
    # Process information
    echo -e "${YELLOW}Process Information:${NC}"
    if [ -f "$LOG_DIR/backend.pid" ]; then
        local backend_pid=$(cat "$LOG_DIR/backend.pid")
        echo "Backend PID: $backend_pid"
        
        # Check if process is running (Windows compatible)
        if command -v tasklist &> /dev/null; then
            tasklist //FI "PID eq $backend_pid" 2>/dev/null | grep -q $backend_pid && echo "  Status: Running" || echo "  Status: Not running"
        else
            ps -p $backend_pid > /dev/null 2>&1 && echo "  Status: Running" || echo "  Status: Not running"
        fi
    fi
    
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        local frontend_pid=$(cat "$LOG_DIR/frontend.pid")
        echo "Frontend PID: $frontend_pid"
        
        if command -v tasklist &> /dev/null; then
            tasklist //FI "PID eq $frontend_pid" 2>/dev/null | grep -q $frontend_pid && echo "  Status: Running" || echo "  Status: Not running"
        else
            ps -p $frontend_pid > /dev/null 2>&1 && echo "  Status: Running" || echo "  Status: Not running"
        fi
    fi
    
    echo
    echo -e "${YELLOW}Port Usage:${NC}"
    echo "Backend Port $BACKEND_PORT:"
    netstat -an | grep ":$BACKEND_PORT " || echo "  Not in use"
    echo "Frontend Port $FRONTEND_PORT:"
    netstat -an | grep ":$FRONTEND_PORT " || echo "  Not in use"
    
    echo
    echo -e "${YELLOW}Log Files:${NC}"
    if [ -f "$LOG_DIR/backend.log" ]; then
        local backend_size=$(du -h "$LOG_DIR/backend.log" 2>/dev/null | cut -f1 || echo "0B")
        echo "Backend log size: $backend_size"
    else
        echo "Backend log: Not found"
    fi
    
    if [ -f "$LOG_DIR/frontend.log" ]; then
        local frontend_size=$(du -h "$LOG_DIR/frontend.log" 2>/dev/null | cut -f1 || echo "0B")
        echo "Frontend log size: $frontend_size"
    else
        echo "Frontend log: Not found"
    fi
}

# Function to stop servers
stop_servers() {
    print_info "Stopping servers..."
    
    # Stop backend
    if [ -f "$LOG_DIR/backend.pid" ]; then
        local backend_pid=$(cat "$LOG_DIR/backend.pid")
        if command -v tasklist &> /dev/null; then
            # Windows
            tasklist //FI "PID eq $backend_pid" 2>/dev/null | grep -q $backend_pid && {
                print_status "Stopping backend server (PID: $backend_pid)..."
                taskkill //PID $backend_pid //F 2>/dev/null || true
            }
        else
            # Unix-like
            ps -p $backend_pid > /dev/null 2>&1 && {
                print_status "Stopping backend server (PID: $backend_pid)..."
                kill $backend_pid 2>/dev/null || kill -9 $backend_pid 2>/dev/null || true
            }
        fi
        rm -f "$LOG_DIR/backend.pid"
    fi
    
    # Stop frontend
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        local frontend_pid=$(cat "$LOG_DIR/frontend.pid")
        if command -v tasklist &> /dev/null; then
            # Windows
            tasklist //FI "PID eq $frontend_pid" 2>/dev/null | grep -q $frontend_pid && {
                print_status "Stopping frontend server (PID: $frontend_pid)..."
                taskkill //PID $frontend_pid //F 2>/dev/null || true
            }
        else
            # Unix-like
            ps -p $frontend_pid > /dev/null 2>&1 && {
                print_status "Stopping frontend server (PID: $frontend_pid)..."
                kill $frontend_pid 2>/dev/null || kill -9 $frontend_pid 2>/dev/null || true
            }
        fi
        rm -f "$LOG_DIR/frontend.pid"
    fi
    
    # Kill any remaining processes on ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    
    print_status "Servers stopped successfully!"
}

# Function to start all servers
start_all_servers() {
    print_info "Starting all servers..."
    
    if start_backend && start_frontend; then
        sleep 3
        if test_api; then
            show_status
            print_status "All servers started successfully!"
            
            # Open browser
            if command -v start &> /dev/null; then
                # Windows
                print_info "Opening browser..."
                start "http://localhost:$FRONTEND_PORT" 2>/dev/null &
            elif command -v xdg-open &> /dev/null; then
                # Linux
                print_info "Opening browser..."
                xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null &
            elif command -v open &> /dev/null; then
                # macOS
                print_info "Opening browser..."
                open "http://localhost:$FRONTEND_PORT" 2>/dev/null &
            fi
            
            return 0
        else
            print_error "API test failed!"
            return 1
        fi
    else
        print_error "Failed to start servers!"
        return 1
    fi
}

# Function to show help
show_help() {
    echo -e "${CYAN}${PROJECT_NAME} Launcher Help${NC}"
    echo "Usage: $0 [OPTION]"
    echo
    echo "Options:"
    echo "  start     Start both frontend and backend servers"
    echo "  stop      Stop both servers"
    echo "  restart   Restart both servers"
    echo "  status    Show server status"
    echo "  monitor   Start server monitoring"
    echo "  logs      Show recent logs"
    echo "  test      Test API connection"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start    # Start all servers"
    echo "  $0 monitor  # Start with monitoring"
    echo "  $0 restart  # Restart all servers"
    echo
    echo "URLs:"
    echo "  Frontend: http://localhost:$FRONTEND_PORT"
    echo "  Backend:  http://localhost:$BACKEND_PORT"
    echo "  Health:   http://localhost:$BACKEND_PORT/health"
}

# Function to show logs
show_logs() {
    echo -e "${CYAN}${PROJECT_NAME} Logs${NC}"
    echo "════════════════════════════════════════"
    
    echo -e "${YELLOW}Backend Logs (last 20 lines):${NC}"
    if [ -f "$LOG_DIR/backend.log" ]; then
        tail -n 20 "$LOG_DIR/backend.log"
    else
        echo "No backend logs found"
    fi
    
    echo
    echo -e "${YELLOW}Frontend Logs (last 10 lines):${NC}"
    if [ -f "$LOG_DIR/frontend.log" ]; then
        tail -n 10 "$LOG_DIR/frontend.log"
    else
        echo "No frontend logs found"
    fi
}

# Cleanup function for graceful shutdown
cleanup() {
    echo
    print_info "Received interrupt signal. Cleaning up..."
    stop_servers
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    case "${1:-start}" in
        start)
            check_prerequisites
            install_dependencies
            start_all_servers
            ;;
        stop)
            stop_servers
            ;;
        restart)
            stop_servers
            sleep 2
            check_prerequisites
            start_all_servers
            ;;
        status)
            show_status
            show_detailed_status
            ;;
        monitor)
            check_prerequisites
            install_dependencies
            start_all_servers
            if [ $? -eq 0 ]; then
                monitor_servers
            fi
            ;;
        logs)
            show_logs
            ;;
        test)
            test_api
            ;;
        help)
            show_help
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Show banner
echo -e "${PURPLE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║                 FlahaSoil Application Launcher                 ║"
echo "║                                                                ║"
echo "║            Professional Soil Analysis Platform                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Run main function
main "$@"