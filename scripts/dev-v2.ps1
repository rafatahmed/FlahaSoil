# FlahaSOIL v2 dev launcher (Windows PowerShell).
#
# Targets ONLY the v2 stack:
#   - backend (@flaha/api)  on port 3002
#   - frontend (@flaha/web) on port 5173
#   - Postgres (DATABASE_URL_V2) on port 5432 (verified, not started)
#
# Does not touch the legacy launcher (scripts/launch-flaha.ps1) or the
# legacy api-implementation/ + public/ stack.
#
# Usage:
#   pwsh ./scripts/dev-v2.ps1 start            # default
#   pwsh ./scripts/dev-v2.ps1 stop
#   pwsh ./scripts/dev-v2.ps1 restart
#   pwsh ./scripts/dev-v2.ps1 status
#   pwsh ./scripts/dev-v2.ps1 help
#
# Flags:
#   -NoGenerate    Skip `prisma generate` before backend start.
#   -SkipDbCheck   Skip the Postgres reachability probe.

param(
    [Parameter(Position = 0)]
    [ValidateSet("start", "stop", "restart", "status", "help")]
    [string]$Action = "start",
    [switch]$NoGenerate,
    [switch]$SkipDbCheck
)

$ErrorActionPreference = 'Stop'

$BACKEND_PORT = 3002
$FRONTEND_PORT = 5173
$POSTGRES_PORT = 5432

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$LogDir = Join-Path $Root 'logs'
$BackendEnv = Join-Path $Root 'backend/.env'
$BackendPidFile = Join-Path $LogDir 'dev-v2-backend.pid'
$FrontendPidFile = Join-Path $LogDir 'dev-v2-frontend.pid'
$BackendLog = Join-Path $LogDir 'dev-v2-backend.log'
$FrontendLog = Join-Path $LogDir 'dev-v2-frontend.log'

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

function Write-Info { param($Msg) Write-Host "[dev-v2] $Msg" -ForegroundColor Cyan }
function Write-Ok { param($Msg) Write-Host "[dev-v2] $Msg" -ForegroundColor Green }
function Write-Warn { param($Msg) Write-Host "[dev-v2] $Msg" -ForegroundColor Yellow }
function Write-Err { param($Msg) Write-Host "[dev-v2] $Msg" -ForegroundColor Red }

function Test-PortListening {
    param([int]$Port)
    $c = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    return [bool]$c
}

function Get-TrackedPid {
    param([string]$PidFile)
    if (-not (Test-Path $PidFile)) { return $null }
    $raw = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if (-not $raw) { return $null }
    $n = 0
    if ([int]::TryParse($raw.Trim(), [ref]$n)) {
        $p = Get-Process -Id $n -ErrorAction SilentlyContinue
        if ($p) { return $n }
    }
    return $null
}

function Test-EnvFile {
    if (-not (Test-Path $BackendEnv)) {
        Write-Err "backend/.env not found. Copy backend/.env.example to backend/.env and set DATABASE_URL_V2."
        return $false
    }
    $hasUrl = (Select-String -Path $BackendEnv -Pattern '^\s*DATABASE_URL_V2\s*=' -Quiet)
    if (-not $hasUrl) {
        Write-Err "backend/.env is missing DATABASE_URL_V2."
        return $false
    }
    Write-Ok "backend/.env present with DATABASE_URL_V2."
    return $true
}

function Test-Postgres {
    if ($SkipDbCheck) { Write-Warn "Skipping Postgres reachability probe (-SkipDbCheck)."; return $true }
    if (Test-PortListening -Port $POSTGRES_PORT) {
        Write-Ok "Postgres is listening on $POSTGRES_PORT."
        return $true
    }
    Write-Err "Postgres is not listening on $POSTGRES_PORT. Start the Postgres service (or pass -SkipDbCheck for a no-DB sanity run)."
    return $false
}

# Probe the backend `/health` endpoint. Port-listening alone is not
# enough — the Express process can bind 3002 while Prisma queries 500
# (see Phase 10S, where a missing v2 schema produced 200 ports + 500
# auth). This returns a structured result so callers can decide whether
# to fail the launch or just flag a warning.
function Test-BackendHealth {
    param([int]$TimeoutSec = 3)
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/health" `
            -TimeoutSec $TimeoutSec -ErrorAction Stop
        if ($r.status -eq 'ok') {
            return @{ Ok = $true; Service = $r.service; Env = $r.env }
        }
        return @{ Ok = $false; Reason = "unexpected payload: $($r | ConvertTo-Json -Compress)" }
    }
    catch {
        return @{ Ok = $false; Reason = $_.Exception.Message }
    }
}

# Probe the Vite dev server. -UseBasicParsing avoids the IE-engine
# prompt under Windows PowerShell 5.x. We only require status 200 + the
# `id="root"` marker — the React bundle itself is mounted client-side
# and is not visible from the initial HTML.
function Test-FrontendHealth {
    param([int]$TimeoutSec = 3)
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$FRONTEND_PORT/" `
            -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
        $hasRoot = $r.Content -match 'id="root"'
        if ($r.StatusCode -eq 200 -and $hasRoot) {
            return @{ Ok = $true; Status = $r.StatusCode; HasRoot = $true }
        }
        return @{ Ok = $false; Reason = "status=$($r.StatusCode) hasRoot=$hasRoot" }
    }
    catch {
        return @{ Ok = $false; Reason = $_.Exception.Message }
    }
}

# Scan the recent backend log for well-known failure signatures and
# return remediation hints. Today we only diagnose the Phase 10S
# missing-schema case; new signatures can be appended as they show up.
function Get-BackendLogHints {
    if (-not (Test-Path $BackendLog)) { return @() }
    $tail = Get-Content $BackendLog -Tail 200 -ErrorAction SilentlyContinue
    if (-not $tail) { return @() }
    $joined = ($tail -join "`n")
    $hints = @()
    if ($joined -match 'does not exist in the current database') {
        $hints += "Backend log shows Prisma 'table/column does not exist' errors."
        $hints += "Sync the v2 schema and re-seed the dev database:"
        $hints += "  npm run prisma:db:push:v2 --workspace @flaha/api"
        $hints += "  npm run prisma:seed:v2 --workspace @flaha/api"
    }
    return $hints
}

function Start-Detached {
    param([string]$Name, [string]$Command, [string]$LogPath, [string]$PidFile)
    $launcher = "Set-Location -Path `"$Root`"; & $Command *>&1 | Tee-Object -FilePath `"$LogPath`""
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($launcher)
    $encoded = [Convert]::ToBase64String($bytes)
    $proc = Start-Process -FilePath 'powershell.exe' `
        -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', $encoded) `
        -WindowStyle Hidden -PassThru
    Set-Content -Path $PidFile -Value $proc.Id
    Write-Ok "$Name started (PID $($proc.Id)). Logs: $LogPath"
}

function Stop-Tracked {
    param([string]$Name, [string]$PidFile, [int]$Port)
    $procPid = Get-TrackedPid -PidFile $PidFile
    if ($procPid) {
        try {
            Stop-Process -Id $procPid -Force -ErrorAction SilentlyContinue
            Get-CimInstance Win32_Process -Filter "ParentProcessId=$procPid" -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
            Write-Ok "$Name (PID $procPid) stopped."
        }
        catch { Write-Warn "$Name PID $procPid could not be stopped: $_" }
        Remove-Item $PidFile -ErrorAction SilentlyContinue
    }
    else {
        Write-Info "${Name}: no tracked PID."
    }
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $listener) {
        if ($conn.OwningProcess -and $conn.OwningProcess -ne 0) {
            try {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Ok "${Name}: also stopped port-holder PID $($conn.OwningProcess) on ${Port}."
            }
            catch { Write-Warn "Failed to stop port-holder PID $($conn.OwningProcess) on ${Port}: $_" }
        }
    }
}

function Show-Status {
    $rows = @()
    $rows += [pscustomobject]@{ Service = 'Postgres'; Port = $POSTGRES_PORT; Listening = (Test-PortListening -Port $POSTGRES_PORT); Health = '(external)'; TrackedPid = '(external)' }

    $beListen = Test-PortListening -Port $BACKEND_PORT
    $beHealth = if ($beListen) { if ((Test-BackendHealth -TimeoutSec 2).Ok) { 'ok' } else { 'FAIL' } } else { '-' }
    $rows += [pscustomobject]@{ Service = 'Backend  (@flaha/api)'; Port = $BACKEND_PORT; Listening = $beListen; Health = $beHealth; TrackedPid = (Get-TrackedPid -PidFile $BackendPidFile) }

    $feListen = Test-PortListening -Port $FRONTEND_PORT
    $feHealth = if ($feListen) { if ((Test-FrontendHealth -TimeoutSec 2).Ok) { 'ok' } else { 'FAIL' } } else { '-' }
    $rows += [pscustomobject]@{ Service = 'Frontend (@flaha/web)'; Port = $FRONTEND_PORT; Listening = $feListen; Health = $feHealth; TrackedPid = (Get-TrackedPid -PidFile $FrontendPidFile) }

    $rows | Format-Table -AutoSize

    if ($beListen -and $beHealth -eq 'FAIL') {
        Write-Err "Backend port is listening but health endpoint failed. Check $BackendLog."
        foreach ($hint in (Get-BackendLogHints)) { Write-Warn $hint }
    }
}


function Invoke-PrismaGenerate {
    if ($NoGenerate) { Write-Warn "Skipping prisma generate (-NoGenerate)."; return $true }
    Write-Info "Running prisma generate (v2 schema)..."
    Push-Location $Root
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        # NOTE: invoke `npm.cmd` directly. Windows PowerShell's `npm`
        # shim mangles the first argument when piped through
        # `Tee-Object`, producing "Unknown command: pm". Output is
        # captured to a log file and stderr is merged so any prisma
        # banner does not get re-raised as a NativeCommandError.
        $logPath = Join-Path $LogDir 'dev-v2-prisma.log'
        & npm.cmd run prisma:generate:v2 --workspace @flaha/api *> $logPath
        $code = $LASTEXITCODE
        if ($code -ne 0) {
            Write-Err "prisma generate failed (exit $code). See $logPath."
            return $false
        }
        Write-Ok "prisma generate completed."
        return $true
    }
    finally {
        $ErrorActionPreference = $prev
        Pop-Location
    }
}

function Start-DevV2 {
    Write-Info "Starting FlahaSOIL v2 dev stack."
    if (-not (Test-EnvFile)) { exit 1 }
    if (-not (Test-Postgres)) { exit 1 }

    if (Test-PortListening -Port $BACKEND_PORT) {
        Write-Warn "Port $BACKEND_PORT already in use. Run 'dev-v2.ps1 stop' first or 'restart'."; exit 1
    }
    if (Test-PortListening -Port $FRONTEND_PORT) {
        Write-Warn "Port $FRONTEND_PORT already in use. Run 'dev-v2.ps1 stop' first or 'restart'."; exit 1
    }

    if (-not (Invoke-PrismaGenerate)) { exit 1 }

    Start-Detached -Name 'backend  (@flaha/api)' `
        -Command 'npm.cmd run dev --workspace @flaha/api' `
        -LogPath $BackendLog -PidFile $BackendPidFile
    Start-Detached -Name 'frontend (@flaha/web)' `
        -Command 'npm.cmd run dev --workspace @flaha/web' `
        -LogPath $FrontendLog -PidFile $FrontendPidFile

    # Backend: first wait for the port to bind, then poll /health.
    # Phase 10S — the bind-only check used to falsely pass when the v2
    # schema was missing (port opened, every DB query 500'd).
    Write-Info "Waiting for backend on $BACKEND_PORT (up to 30s)..."
    $beListening = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-PortListening -Port $BACKEND_PORT) { Write-Ok "Backend listening on $BACKEND_PORT."; $beListening = $true; break }
    }
    if (-not $beListening) {
        Write-Err "Backend did not bind $BACKEND_PORT within 30s. Check $BackendLog."
        Show-Status
        exit 1
    }
    Write-Info "Polling backend /health (up to 30s)..."
    $beHealthy = $false
    for ($i = 0; $i -lt 30; $i++) {
        $h = Test-BackendHealth -TimeoutSec 2
        if ($h.Ok) { Write-Ok "Backend /health = ok (service=$($h.Service) env=$($h.Env))."; $beHealthy = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $beHealthy) {
        Write-Err "Backend port is listening but health endpoint failed. Check $BackendLog."
        foreach ($hint in (Get-BackendLogHints)) { Write-Warn $hint }
        Show-Status
        exit 1
    }

    # Frontend: wait for the port, then verify Vite returns the SPA HTML.
    Write-Info "Waiting for frontend on $FRONTEND_PORT (up to 30s)..."
    $feListening = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-PortListening -Port $FRONTEND_PORT) { Write-Ok "Frontend listening on $FRONTEND_PORT."; $feListening = $true; break }
    }
    if ($feListening) {
        $feOk = $false
        for ($i = 0; $i -lt 10; $i++) {
            $f = Test-FrontendHealth -TimeoutSec 2
            if ($f.Ok) { Write-Ok "Frontend / = 200 (id=`"root`" present)."; $feOk = $true; break }
            Start-Sleep -Seconds 1
        }
        if (-not $feOk) {
            Write-Warn "Frontend HTML probe failed: $($f.Reason). Vite is listening, but the SPA shell did not respond as expected."
        }
    }
    else {
        Write-Warn "Frontend did not bind $FRONTEND_PORT within 30s. Check $FrontendLog."
    }

    Show-Status
    Write-Ok "Open http://localhost:$FRONTEND_PORT/  |  API: http://localhost:$BACKEND_PORT/api/v2"
}

function Stop-DevV2 {
    Write-Info "Stopping FlahaSOIL v2 dev stack."
    Stop-Tracked -Name 'frontend (@flaha/web)' -PidFile $FrontendPidFile -Port $FRONTEND_PORT
    Stop-Tracked -Name 'backend  (@flaha/api)' -PidFile $BackendPidFile  -Port $BACKEND_PORT
    Show-Status
}

function Show-Help {
    @"
FlahaSOIL v2 dev launcher

Actions:
  start    Verify env + Postgres, run prisma generate, start backend + frontend,
           then poll backend /health and frontend / for SPA HTML before reporting OK.
  stop     Stop tracked backend + frontend processes and free their ports.
  restart  stop then start.
  status   Show Postgres / backend / frontend port, /health probe, and tracked-PID state.
  help     Show this message.

Health policy:
  - Backend is considered healthy only when GET http://localhost:$BACKEND_PORT/health
    returns {"status":"ok"} within 30s after the port binds.
  - Frontend is considered healthy when GET http://localhost:$FRONTEND_PORT/ returns 200
    and contains the SPA root element. A bound port without HTML is a warning, not a hard fail.
  - If the backend log contains Prisma 'does not exist in the current database' errors,
    the launcher prints a hint to run:
      npm run prisma:db:push:v2 --workspace @flaha/api
      npm run prisma:seed:v2 --workspace @flaha/api

Flags:
  -NoGenerate    Skip 'prisma generate' before backend start.
  -SkipDbCheck   Skip the Postgres reachability probe.

Ports: backend=$BACKEND_PORT  frontend=$FRONTEND_PORT  postgres=$POSTGRES_PORT
Logs:  $LogDir\dev-v2-*.log
"@ | Write-Host
}

switch ($Action) {
    "start" { Start-DevV2 }
    "stop" { Stop-DevV2 }
    "restart" { Stop-DevV2; Start-Sleep -Seconds 2; Start-DevV2 }
    "status" { Show-Status }
    "help" { Show-Help }
}
