<!-- @format -->

# FlahaSoil Launch Scripts

This directory contains scripts to easily launch and manage your FlahaSoil application.

## Available Scripts

### Main Scripts

- **`launch-flaha.sh`** - Main Bash script (Linux/macOS/WSL)
- **`launch-flaha.ps1`** - PowerShell script (Windows)
- **`launch-flaha.bat`** - Windows batch file wrapper

### Quick Start Scripts

- **`quick-start.sh`** - Quick start with monitoring (Bash)
- **`quick-start.bat`** - Quick start with monitoring (Windows)
- **`dev-start.sh`** - Development mode with auto-restart

## Usage

### Windows (PowerShell)

```powershell
# Navigate to scripts directory
cd scripts

# Start all servers
.\launch-flaha.ps1 start

# Start with monitoring
.\launch-flaha.ps1 monitor

# Stop servers
.\launch-flaha.ps1 stop

# Show status
.\launch-flaha.ps1 status

# Show help
.\launch-flaha.ps1 help
```

### Windows (Batch)

```cmd
# Navigate to scripts directory
cd scripts

# Start with monitoring
quick-start.bat

# Or use the main launcher
launch-flaha.bat start
```

### Linux/macOS/WSL (Bash)

```bash
# Navigate to scripts directory
cd scripts

# Make scripts executable
chmod +x *.sh

# Start all servers
./launch-flaha.sh start

# Start with monitoring
./launch-flaha.sh monitor

# Quick start
./quick-start.sh

# Development mode
./dev-start.sh
```

## Script Options

All main scripts support these options:

- **`start`** - Start both frontend and backend servers
- **`stop`** - Stop both servers
- **`restart`** - Restart both servers
- **`status`** - Show server status
- **`monitor`** - Start with real-time monitoring
- **`logs`** - Show recent logs
- **`test`** - Test API connection
- **`help`** - Show help information

## Features

✅ **Cross-platform support** (Windows, Linux, macOS)  
✅ **Automatic dependency checking** and installation  
✅ **Port conflict resolution**  
✅ **Real-time monitoring** with colorful output  
✅ **Health checks** and API testing  
✅ **Graceful shutdown** handling  
✅ **Log management** and viewing  
✅ **Process tracking** with PID files  
✅ **Auto-browser opening**

## Prerequisites

### Windows

- Node.js (https://nodejs.org/)
- PowerShell 5.0+ (built into Windows 10/11)
- Python (optional, for frontend server)

### Linux/macOS

- Node.js
- Bash shell
- Python 3 (optional, for frontend server)
- curl (for health checks)

## Ports

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Logs

Logs are stored in the `../logs/` directory:

- `backend.log` - Backend server logs
- `frontend.log` - Frontend server logs
- `backend.pid` - Backend process ID
- `frontend.pid` - Frontend process ID

## Troubleshooting

### Port Already in Use

The scripts automatically detect and kill processes on the required ports.

### Permission Denied (Linux/macOS)

```bash
chmod +x scripts/*.sh
```

### PowerShell Execution Policy (Windows)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Missing Dependencies

The scripts will check for and install missing dependencies automatically.

## Development Mode

Use `dev-start.sh` for development with auto-restart:

- Backend restarts automatically when files change (using nodemon)
- Frontend serves static files
- Ideal for development workflow

## Examples

### Start Everything

```bash
# Linux/macOS
./scripts/launch-flaha.sh monitor

# Windows
scripts\launch-flaha.ps1 monitor
```

### Check Status

```bash
# Linux/macOS
./scripts/launch-flaha.sh status

# Windows
scripts\launch-flaha.ps1 status
```

### View Logs

```bash
# Linux/macOS
./scripts/launch-flaha.sh logs

# Windows
scripts\launch-flaha.ps1 logs
```

---

**Happy coding with FlahaSoil!** 🌱
