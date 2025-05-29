# filepath: C:\Users\rafat\repo\Flaha\FlahaSoil\scripts\launch-flaha.ps1

# FlahaSoil Application Launcher for Windows PowerShell
param(
    [Parameter(Position = 0)]
    [ValidateSet("start", "stop", "restart", "status", "monitor", "logs", "test", "help")]
    [string]$Action = "start"
)

# Configuration
$FRONTEND_PORT = 3000
$BACKEND_PORT = 3001
$PROJECT_NAME = "FlahaSoil"

# Get the correct paths based on script location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LOG_DIR = Join-Path $ProjectRoot "logs"
$FRONTEND_DIR = Join-Path $ProjectRoot "public"
$BACKEND_DIR = Join-Path $ProjectRoot "api-implementation"

# Colors
$Colors = @{
    Red     = "Red"
    Green   = "Green"
    Yellow  = "Yellow"
    Blue    = "Blue"
    Magenta = "Magenta"
    Cyan    = "Cyan"
    White   = "White"
}

function Write-ColoredOutput {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Test-Port {
    param($Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    }
    catch {
        return $false
    }
}

# Fix for line 57: Rename $pid to $processPid to avoid conflict with automatic variable
function Stop-ProcessOnPort {
    param($Port)
    Write-ColoredOutput "Checking for processes on port $Port..." "Yellow"
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($connection in $connections) {
            $processPid = $connection.OwningProcess  # Changed from $pid to $processPid
            if ($processPid -and $processPid -ne 0) {
                Write-ColoredOutput "Killing process on port $Port (PID: $processPid)" "Yellow"
                try {
                    Stop-Process -Id $processPid -Force -ErrorAction SilentlyContinue
                    Write-ColoredOutput "Successfully stopped process $processPid" "Green"
                }
                catch {
                    Write-ColoredOutput "Failed to kill process $processPid`: $($_.Exception.Message)" "Red"
                }
            }
        }
    }
    catch {
        Write-ColoredOutput "No processes found on port $Port or unable to check" "Blue"
    }
    Start-Sleep 2
}

function Test-Prerequisites {
    Write-ColoredOutput "Checking prerequisites..." "Blue"
    
    # Check Node.js
    try {
        $nodeVersion = & node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColoredOutput "Node.js version: $nodeVersion" "Green"
        }
        else {
            throw "Node.js not found"
        }
    }
    catch {
        Write-ColoredOutput "Node.js is not installed. Please install Node.js first." "Red"
        Write-ColoredOutput "Download from: https://nodejs.org/" "Blue"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = & npm --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColoredOutput "npm version: $npmVersion" "Green"
        }
        else {
            throw "npm not found"
        }
    }
    catch {
        Write-ColoredOutput "npm is not installed. Please install npm first." "Red"
        exit 1
    }
    
    # Check directories
    Write-ColoredOutput "Checking project structure..." "Blue"
    Write-ColoredOutput "Project root: $ProjectRoot" "Blue"
    Write-ColoredOutput "Backend dir: $BACKEND_DIR" "Blue"
    Write-ColoredOutput "Frontend dir: $FRONTEND_DIR" "Blue"
    Write-ColoredOutput "Logs dir: $LOG_DIR" "Blue"
    
    if (-not (Test-Path $BACKEND_DIR)) {
        Write-ColoredOutput "Backend directory '$BACKEND_DIR' not found!" "Red"
        Write-ColoredOutput "Current location: $(Get-Location)" "Blue"
        exit 1
    }
    
    if (-not (Test-Path $FRONTEND_DIR)) {
        Write-ColoredOutput "Frontend directory '$FRONTEND_DIR' not found!" "Red"
        Write-ColoredOutput "Current location: $(Get-Location)" "Blue"
        exit 1
    }
    
    if (-not (Test-Path (Join-Path $BACKEND_DIR "package.json"))) {
        Write-ColoredOutput "Backend package.json not found!" "Red"
        exit 1
    }
    
    # Create logs directory if it doesn't exist
    if (-not (Test-Path $LOG_DIR)) {
        Write-ColoredOutput "Creating logs directory: $LOG_DIR" "Blue"
        try {
            New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null
            Write-ColoredOutput "Logs directory created successfully" "Green"
        }
        catch {
            Write-ColoredOutput "Failed to create logs directory: $($_.Exception.Message)" "Red"
            exit 1
        }
    }
}

function Install-Dependencies {
    Write-ColoredOutput "Installing/updating dependencies..." "Blue"
    
    $currentLocation = Get-Location
    try {
        Set-Location $BACKEND_DIR
        Write-ColoredOutput "Installing backend dependencies..." "Green"
        
        $installResult = & npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColoredOutput "Dependencies installed successfully!" "Green"
        }
        else {
            Write-ColoredOutput "Failed to install dependencies!" "Red"
            Write-ColoredOutput "$installResult" "Red"
            exit 1
        }
    }
    catch {
        Write-ColoredOutput "Failed to install dependencies: $($_.Exception.Message)" "Red"
        exit 1
    }
    finally {
        Set-Location $currentLocation
    }
}

function Start-Backend {
    Write-ColoredOutput "Starting backend server..." "Blue"
    
    if (Test-Port $BACKEND_PORT) {
        Write-ColoredOutput "Port $BACKEND_PORT is already in use" "Yellow"
        Stop-ProcessOnPort $BACKEND_PORT
    }
    
    $currentLocation = Get-Location
    try {
        Set-Location $BACKEND_DIR
        Write-ColoredOutput "Launching backend server on port $BACKEND_PORT..." "Green"
        
        # Create log file paths
        $backendLogPath = Join-Path $LOG_DIR "backend.log"
        $backendPidPath = Join-Path $LOG_DIR "backend.pid"
        
        Write-ColoredOutput "Backend log path: $backendLogPath" "Blue"
        Write-ColoredOutput "Backend PID path: $backendPidPath" "Blue"
        
        # Start Node.js process
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "node"
        $processInfo.Arguments = "server.js"
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        $processInfo.WorkingDirectory = $BACKEND_DIR
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        
        # Save PID to file
        try {
            $process.Id | Out-File -FilePath $backendPidPath -Encoding ASCII -Force
            Write-ColoredOutput "Backend PID ($($process.Id)) saved to: $backendPidPath" "Green"
        }
        catch {
            Write-ColoredOutput "Warning: Could not save PID file: $($_.Exception.Message)" "Yellow"
        }
        
        # Start background job to handle output and store the job ID
        $backendJob = Start-Job -ScriptBlock {
            param($Process, $LogPath)
            try {
                while (-not $Process.HasExited) {
                    $output = $Process.StandardOutput.ReadLine()
                    if ($output) {
                        Add-Content -Path $LogPath -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $output" -Force
                    }
                    Start-Sleep -Milliseconds 100
                }
            }
            catch {
                # Process may have exited
            }
        } -ArgumentList $process, $backendLogPath
        
        # Register the job for cleanup
        if (-not (Test-Path variable:script:backgroundJobs)) {
            $script:backgroundJobs = @()
        }
        $script:backgroundJobs += $backendJob
        
        # Wait for backend to start
        Write-ColoredOutput "Waiting for backend server to start..." "Blue"
        $attempts = 0
        $maxAttempts = 30
        
        while ($attempts -lt $maxAttempts) {
            if (Test-Port $BACKEND_PORT) {
                Write-ColoredOutput "Backend server started successfully on port $BACKEND_PORT (PID: $($process.Id))" "Green"
                return $true
            }
            Start-Sleep 1
            $attempts++
            if ($attempts % 5 -eq 0) {
                Write-Host "." -NoNewline
            }
        }
        
        Write-ColoredOutput "`nBackend server failed to start within 30 seconds" "Red"
        
        # Check if process is still running
        if (-not $process.HasExited) {
            Write-ColoredOutput "Process is still running, but port is not accessible" "Yellow"
            Write-ColoredOutput "Stopping the process..." "Yellow"
            $process.Kill()
        }
        
        return $false
    }
    catch {
        Write-ColoredOutput "Error starting backend: $($_.Exception.Message)" "Red"
        return $false
    }
    finally {
        Set-Location $currentLocation
    }
}

function Start-Frontend {
    Write-ColoredOutput "Starting frontend server..." "Blue"
    
    if (Test-Port $FRONTEND_PORT) {
        Write-ColoredOutput "Port $FRONTEND_PORT is already in use" "Yellow"
        Stop-ProcessOnPort $FRONTEND_PORT
    }
    
    $currentLocation = Get-Location
    try {
        Set-Location $FRONTEND_DIR
        Write-ColoredOutput "Launching frontend server on port $FRONTEND_PORT..." "Green"
        
        # Create log file paths
        $frontendLogPath = Join-Path $LOG_DIR "frontend.log"
        $frontendPidPath = Join-Path $LOG_DIR "frontend.pid"
        
        # Try Python first, then Python3, then npx serve
        $pythonCommand = $null
        $arguments = $null
        
        if (Get-Command python -ErrorAction SilentlyContinue) {
            $pythonCommand = "python"
            $arguments = "-m http.server $FRONTEND_PORT"
        }
        elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
            $pythonCommand = "python3"
            $arguments = "-m http.server $FRONTEND_PORT"
        }
        elseif (Get-Command npx -ErrorAction SilentlyContinue) {
            $pythonCommand = "npx"
            $arguments = "serve -p $FRONTEND_PORT"
        }
        else {
            Write-ColoredOutput "No suitable HTTP server found!" "Red"
            Write-ColoredOutput "Please install one of the following:" "Blue"
            Write-ColoredOutput "  - Python: https://www.python.org/downloads/" "Blue"
            Write-ColoredOutput "  - serve: npm install -g serve" "Blue"
            return $false
        }
        
        Write-ColoredOutput "Using command: $pythonCommand $arguments" "Blue"
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = $pythonCommand
        $processInfo.Arguments = $arguments
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        $processInfo.WorkingDirectory = $FRONTEND_DIR
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        
        # Save PID to file
        try {
            $process.Id | Out-File -FilePath $frontendPidPath -Encoding ASCII -Force
            Write-ColoredOutput "Frontend PID ($($process.Id)) saved to: $frontendPidPath" "Green"
        }
        catch {
            Write-ColoredOutput "Warning: Could not save PID file: $($_.Exception.Message)" "Yellow"
        }
        
        # Start background job to handle output and store the job ID
        $frontendJob = Start-Job -ScriptBlock {
            param($Process, $LogPath)
            try {
                while (-not $Process.HasExited) {
                    $output = $Process.StandardOutput.ReadLine()
                    if ($output) {
                        Add-Content -Path $LogPath -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $output" -Force
                    }
                    Start-Sleep -Milliseconds 100
                }
            }
            catch {
                # Process may have exited
            }
        } -ArgumentList $process, $frontendLogPath
        
        # Register the job for cleanup
        if (-not (Test-Path variable:script:backgroundJobs)) {
            $script:backgroundJobs = @()
        }
        $script:backgroundJobs += $frontendJob
        
        # Wait for frontend to start
        Write-ColoredOutput "Waiting for frontend server to start..." "Blue"
        $attempts = 0
        $maxAttempts = 15
        
        while ($attempts -lt $maxAttempts) {
            if (Test-Port $FRONTEND_PORT) {
                Write-ColoredOutput "Frontend server started successfully on port $FRONTEND_PORT (PID: $($process.Id))" "Green"
                return $true
            }
            Start-Sleep 1
            $attempts++
            if ($attempts % 3 -eq 0) {
                Write-Host "." -NoNewline
            }
        }
        
        Write-ColoredOutput "`nFrontend server failed to start within 15 seconds" "Red"
        
        # Check if process is still running
        if (-not $process.HasExited) {
            Write-ColoredOutput "Process is still running, but port is not accessible" "Yellow"
            Write-ColoredOutput "Stopping the process..." "Yellow"
            $process.Kill()
        }
        
        return $false
    }
    catch {
        Write-ColoredOutput "Error starting frontend: $($_.Exception.Message)" "Red"
        return $false
    }
    finally {
        Set-Location $currentLocation
    }
}

function Test-API {
    Write-ColoredOutput "Testing API connection..." "Blue"
    
    $healthUrl = "http://localhost:$BACKEND_PORT/health"
    $attempts = 0
    $maxAttempts = 10
    
    while ($attempts -lt $maxAttempts) {
        try {
            $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 5 -ErrorAction Stop
            Write-ColoredOutput "API health check passed!" "Green"
            Write-ColoredOutput "API Response: $($response | ConvertTo-Json -Compress)" "Blue"
            return $true
        }
        catch {
            Start-Sleep 2
            $attempts++
            Write-ColoredOutput "Attempt $attempts/$maxAttempts`: Waiting for API..." "Blue"
        }
    }
    
    Write-ColoredOutput "API health check failed after $maxAttempts attempts" "Red"
    Write-ColoredOutput "Last error: $($_.Exception.Message)" "Red"
    return $false
}

function Show-Status {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║          $PROJECT_NAME Server Status          ║" -ForegroundColor Magenta
    Write-Host "╠════════════════════════════════════════╣" -ForegroundColor Magenta
    
    if (Test-Port $BACKEND_PORT) {
        Write-Host "║ Backend:  ✓ Running on port $BACKEND_PORT    ║" -ForegroundColor Magenta
    }
    else {
        Write-Host "║ Backend:  ✗ Stopped                  ║" -ForegroundColor Magenta
    }
    
    if (Test-Port $FRONTEND_PORT) {
        Write-Host "║ Frontend: ✓ Running on port $FRONTEND_PORT    ║" -ForegroundColor Magenta
    }
    else {
        Write-Host "║ Frontend: ✗ Stopped                  ║" -ForegroundColor Magenta
    }
    
    Write-Host "╠════════════════════════════════════════╣" -ForegroundColor Magenta
    Write-Host "║ Frontend URL: http://localhost:$FRONTEND_PORT ║" -ForegroundColor Magenta
    Write-Host "║ API URL:      http://localhost:$BACKEND_PORT  ║" -ForegroundColor Magenta
    Write-Host "║ Health Check: http://localhost:$BACKEND_PORT/health ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
}

function Show-DetailedStatus {
    Write-Host "$PROJECT_NAME Detailed Status" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════"
    
    # Process information
    Write-Host "Process Information:" -ForegroundColor Yellow
    
    $backendPidPath = Join-Path $LOG_DIR "backend.pid"
    if (Test-Path $backendPidPath) {
        $backendPid = Get-Content $backendPidPath -ErrorAction SilentlyContinue
        if ($backendPid) {
            Write-Host "Backend PID: $backendPid"
            try {
                $process = Get-Process -Id $backendPid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  Status: Running" -ForegroundColor Green
                    Write-Host "  Process Name: $($process.ProcessName)"
                    Write-Host "  CPU Time: $($process.TotalProcessorTime)"
                    Write-Host "  Memory: $([math]::Round($process.WorkingSet64/1MB, 2)) MB"
                }
                else {
                    Write-Host "  Status: Not running" -ForegroundColor Red
                }
            }
            catch {
                Write-Host "  Status: Unknown" -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host "Backend PID: Not found"
    }
    
    $frontendPidPath = Join-Path $LOG_DIR "frontend.pid"
    if (Test-Path $frontendPidPath) {
        $frontendPid = Get-Content $frontendPidPath -ErrorAction SilentlyContinue
        if ($frontendPid) {
            Write-Host "Frontend PID: $frontendPid"
            try {
                $process = Get-Process -Id $frontendPid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  Status: Running" -ForegroundColor Green
                    Write-Host "  Process Name: $($process.ProcessName)"
                    Write-Host "  CPU Time: $($process.TotalProcessorTime)"
                    Write-Host "  Memory: $([math]::Round($process.WorkingSet64/1MB, 2)) MB"
                }
                else {
                    Write-Host "  Status: Not running" -ForegroundColor Red
                }
            }
            catch {
                Write-Host "  Status: Unknown" -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host "Frontend PID: Not found"
    }
    
    Write-Host ""
    Write-Host "Port Usage:" -ForegroundColor Yellow
    Write-Host "Backend Port $BACKEND_PORT`:"
    try {
        $connections = Get-NetTCPConnection -LocalPort $BACKEND_PORT -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                Write-Host "  PID: $($conn.OwningProcess), State: $($conn.State)"
            }
        }
        else {
            Write-Host "  Not in use"
        }
    }
    catch {
        Write-Host "  Unable to check"
    }
    
    Write-Host "Frontend Port $FRONTEND_PORT`:"
    try {
        $connections = Get-NetTCPConnection -LocalPort $FRONTEND_PORT -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                Write-Host "  PID: $($conn.OwningProcess), State: $($conn.State)"
            }
        }
        else {
            Write-Host "  Not in use"
        }
    }
    catch {
        Write-Host "  Unable to check"
    }
    
    Write-Host ""
    Write-Host "Log Files:" -ForegroundColor Yellow
    
    $backendLogPath = Join-Path $LOG_DIR "backend.log"
    if (Test-Path $backendLogPath) {
        $backendSize = [math]::Round((Get-Item $backendLogPath).Length / 1KB, 2)
        Write-Host "Backend log size: $backendSize KB"
    }
    else {
        Write-Host "Backend log: Not found"
    }
    
    $frontendLogPath = Join-Path $LOG_DIR "frontend.log"
    if (Test-Path $frontendLogPath) {
        $frontendSize = [math]::Round((Get-Item $frontendLogPath).Length / 1KB, 2)
        Write-Host "Frontend log size: $frontendSize KB"
    }
    else {
        Write-Host "Frontend log: Not found"
    }
}

# Add a function to stop background jobs during cleanup
function Stop-BackgroundJobs {
    if (Test-Path variable:script:backgroundJobs) {
        foreach ($job in $script:backgroundJobs) {
            if ($job.State -ne 'Completed' -and $job.State -ne 'Failed') {
                Write-ColoredOutput "Stopping background job $($job.Id)..." "Blue"
                Stop-Job -Job $job -ErrorAction SilentlyContinue
                Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
            }
        }
        $script:backgroundJobs = @()
    }
}

function Stop-Servers {
    Write-ColoredOutput "Stopping servers..." "Blue"
    
    # Stop background jobs first
    Stop-BackgroundJobs
    
    # Stop backend
    $backendPidPath = Join-Path $LOG_DIR "backend.pid"
    if (Test-Path $backendPidPath) {
        $backendPid = Get-Content $backendPidPath -ErrorAction SilentlyContinue
        if ($backendPid) {
            try {
                Write-ColoredOutput "Stopping backend server (PID: $backendPid)..." "Green"
                Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
                Write-ColoredOutput "Backend server stopped" "Green"
            }
            catch {
                Write-ColoredOutput "Failed to stop backend process: $($_.Exception.Message)" "Yellow"
            }
            Remove-Item $backendPidPath -ErrorAction SilentlyContinue
        }
    }
    
    # Stop frontend
    $frontendPidPath = Join-Path $LOG_DIR "frontend.pid"
    if (Test-Path $frontendPidPath) {
        $frontendPid = Get-Content $frontendPidPath -ErrorAction SilentlyContinue
        if ($frontendPid) {
            try {
                Write-ColoredOutput "Stopping frontend server (PID: $frontendPid)..." "Green"
                Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
                Write-ColoredOutput "Frontend server stopped" "Green"
            }
            catch {
                Write-ColoredOutput "Failed to stop frontend process: $($_.Exception.Message)" "Yellow"
            }
            Remove-Item $frontendPidPath -ErrorAction SilentlyContinue
        }
    }
    
    # Kill any remaining processes on ports
    Stop-ProcessOnPort $BACKEND_PORT
    Stop-ProcessOnPort $FRONTEND_PORT
    
    Write-ColoredOutput "Servers stopped successfully!" "Green"
}

function Start-AllServers {
    Write-ColoredOutput "Starting all servers..." "Blue"
    
    $backendStarted = Start-Backend
    if (-not $backendStarted) {
        Write-ColoredOutput "Failed to start backend server!" "Red"
        return $false
    }
    
    $frontendStarted = Start-Frontend
    if (-not $frontendStarted) {
        Write-ColoredOutput "Failed to start frontend server!" "Red"
        Write-ColoredOutput "Stopping backend server..." "Yellow"
        Stop-Servers
        return $false
    }
    
    Start-Sleep 3
    
    if (Test-API) {
        Show-Status
        Write-ColoredOutput "All servers started successfully!" "Green"
        
        # Open browser
        Write-ColoredOutput "Opening browser..." "Blue"
        try {
            Start-Process "http://localhost:$FRONTEND_PORT"
        }
        catch {
            Write-ColoredOutput "Could not open browser automatically. Please navigate to: http://localhost:$FRONTEND_PORT" "Yellow"
        }
        
        return $true
    }
    else {
        Write-ColoredOutput "API test failed!" "Red"
        Write-ColoredOutput "Stopping all servers..." "Yellow"
        Stop-Servers
        return $false
    }
}

function Show-Logs {
    Write-Host "$PROJECT_NAME Logs" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════"
    
    Write-Host "Backend Logs (last 20 lines):" -ForegroundColor Yellow
    $backendLogPath = Join-Path $LOG_DIR "backend.log"
    if (Test-Path $backendLogPath) {
        Get-Content $backendLogPath -Tail 20 -ErrorAction SilentlyContinue
    }
    else {
        Write-Host "No backend logs found"
    }
    
    Write-Host ""
    Write-Host "Frontend Logs (last 10 lines):" -ForegroundColor Yellow
    $frontendLogPath = Join-Path $LOG_DIR "frontend.log"
    if (Test-Path $frontendLogPath) {
        Get-Content $frontendLogPath -Tail 10 -ErrorAction SilentlyContinue
    }
    else {
        Write-Host "No frontend logs found"
    }
}

function Show-Help {
    Write-Host "$PROJECT_NAME Launcher Help" -ForegroundColor Cyan
    Write-Host "Usage: .\launch-flaha.ps1 [OPTION]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  start     Start both frontend and backend servers"
    Write-Host "  stop      Stop both servers"
    Write-Host "  restart   Restart both servers"
    Write-Host "  status    Show server status"
    Write-Host "  monitor   Start server monitoring"
    Write-Host "  logs      Show recent logs"
    Write-Host "  test      Test API connection"
    Write-Host "  help      Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\launch-flaha.ps1 start    # Start all servers"
    Write-Host "  .\launch-flaha.ps1 monitor  # Start with monitoring"
    Write-Host "  .\launch-flaha.ps1 restart  # Restart all servers"
    Write-Host ""
    Write-Host "URLs:"
    Write-Host "  Frontend: http://localhost:$FRONTEND_PORT"
    Write-Host "  Backend:  http://localhost:$BACKEND_PORT"
    Write-Host "  Health:   http://localhost:$BACKEND_PORT/health"
}

function Start-Monitoring {
    Write-ColoredOutput "Starting server monitoring... (Press Ctrl+C to stop)" "Blue"
    
    try {
        while ($true) {
            Clear-Host
            Write-Host "$PROJECT_NAME Server Monitor" -ForegroundColor Cyan
            Write-Host "$(Get-Date)" -ForegroundColor Cyan
            Write-Host "════════════════════════════════════════"
            
            Show-Status
            Show-DetailedStatus
            
            Write-Host ""
            Write-Host "Recent Backend Logs:" -ForegroundColor Yellow
            $backendLogPath = Join-Path $LOG_DIR "backend.log"
            if (Test-Path $backendLogPath) {
                Get-Content $backendLogPath -Tail 5 -ErrorAction SilentlyContinue
            }
            else {
                Write-Host "No backend logs yet"
            }
            
            Write-Host ""
            Write-Host "Recent Frontend Logs:" -ForegroundColor Yellow
            $frontendLogPath = Join-Path $LOG_DIR "frontend.log"
            if (Test-Path $frontendLogPath) {
                Get-Content $frontendLogPath -Tail 3 -ErrorAction SilentlyContinue
            }
            else {
                Write-Host "No frontend logs yet"
            }
            
            Write-Host ""
            Write-Host "Press Ctrl+C to stop monitoring"
            Write-Host "Monitoring... (refreshing every 10 seconds)"
            
            Start-Sleep 10
        }
    }
    catch [System.Management.Automation.PipelineStoppedException] {
        Write-ColoredOutput "Monitoring stopped by user" "Blue"
    }
}

# Show banner
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "║                 FlahaSoil Application Launcher                 ║" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "║            Professional Soil Analysis Platform                ║" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Main execution
switch ($Action) {
    "start" {
        Test-Prerequisites
        Install-Dependencies
        $result = Start-AllServers
        if ($result) {
            Write-Host ""
            Write-ColoredOutput "🚀 FlahaSoil is now running!" "Green"
            Write-ColoredOutput "Frontend: http://localhost:$FRONTEND_PORT" "Cyan"
            Write-ColoredOutput "Backend:  http://localhost:$BACKEND_PORT" "Cyan"
        }
    }
    "stop" {
        Stop-Servers
    }
    "restart" {
        Stop-Servers
        Start-Sleep 2
        Test-Prerequisites
        $result = Start-AllServers
        if ($result) {
            Write-ColoredOutput "🚀 FlahaSoil restarted successfully!" "Green"
        }
    }
    "status" {
        Show-Status
        Show-DetailedStatus
    }
    "monitor" {
        Test-Prerequisites
        Install-Dependencies
        if (Start-AllServers) {
            Start-Monitoring
        }
    }
    "logs" {
        Show-Logs
    }
    "test" {
        $result = Test-API
        if ($result) {
            Write-ColoredOutput "✅ API test passed!" "Green"
        }
        else {
            Write-ColoredOutput "❌ API test failed!" "Red"
        }
    }
    "help" {
        Show-Help
    }
    default {
        Write-ColoredOutput "Unknown option: $Action" "Red"
        Show-Help
    }
}