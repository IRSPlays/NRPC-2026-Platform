#!/usr/bin/env pwsh
# NRPC Platform - Automated Google Drive Backup Runner
# Runs every 5 minutes with automatic retry and logging
# 
# Installation:
# 1. Open PowerShell as Administrator
# 2. Run: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
# 3. To start: .\backup-runner.ps1
# 4. To run in background: Start-Process -WindowStyle Hidden pwsh -ArgumentList "-File backup-runner.ps1"
# 
# Task Scheduler (run every 5 minutes):
# 1. Open Task Scheduler
# 2. Create Task
# 3. Trigger: Every 5 minutes, repeat indefinitely
# 4. Action: Start program "pwsh.exe"
# 5. Arguments: "-File C:\path\to\backup-runner.ps1"

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupScript = Join-Path $ScriptDir "quick-upload.js"
$LogFile = Join-Path $ScriptDir "logs" "backup-runner.log"
$IntervalSeconds = 300  # 5 minutes
$MaxRetries = 3
$RetryDelaySeconds = 5

# Ensure logs directory exists
if (-not (Test-Path (Join-Path $ScriptDir "logs"))) {
    New-Item -ItemType Directory -Path (Join-Path $ScriptDir "logs") -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

function Run-Backup {
    $Retries = 0
    while ($Retries -lt $MaxRetries) {
        $Retries++
        Write-Log "Backup attempt $Retries of $MaxRetries..."
        
        try {
            $Result = node $BackupScript 2>&1 | Out-String
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Backup completed successfully"
                return $true
            } else {
                Write-Log "Backup failed: $Result"
            }
        } catch {
            Write-Log "Backup error: $_"
        }
        
        if ($Retries -lt $MaxRetries) {
            Write-Log "Retrying in $RetryDelaySeconds seconds..."
            Start-Sleep -Seconds $RetryDelaySeconds
        }
    }
    
    Write-Log "ERROR: All $MaxRetries backup attempts failed"
    return $false
}

# ASCII Art Header
$Header = @"

═══════════════════════════════════════════════════════════
   NRPC Platform - Automated Google Drive Backup
═══════════════════════════════════════════════════════════
   Runs every 5 minutes with automatic retry
   Log file: $LogFile
═══════════════════════════════════════════════════════════

"@
Clear-Host
Write-Host $Header -ForegroundColor Cyan
Write-Log "========================================"
Write-Log "NRPC Backup Runner Started"
Write-Log "========================================"

# Check if backup script exists
if (-not (Test-Path $BackupScript)) {
    Write-Log "ERROR: Backup script not found: $BackupScript"
    Write-Host "ERROR: Backup script not found!" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $NodeVersion = node --version 2>&1
    Write-Log "Node.js version: $NodeVersion"
} catch {
    Write-Log "ERROR: Node.js not found!"
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    exit 1
}

Write-Log "Starting backup loop (every $IntervalSeconds seconds)..."
Write-Host "`nStarting backup loop... Press Ctrl+C to stop.`n" -ForegroundColor Yellow

# Main backup loop
$Iteration = 0
while ($true) {
    $Iteration++
    Write-Host "`n[$Iteration] $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    
    $Success = Run-Backup
    
    if ($Success) {
        Write-Host "   ✅ Backup successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backup failed" -ForegroundColor Red
    }
    
    Write-Log "Waiting $IntervalSeconds seconds until next backup..."
    Write-Host "   ⏳ Next backup in 5 minutes... (Ctrl+C to stop)" -ForegroundColor DarkGray
    
    # Wait with countdown (update every minute)
    $Waited = 0
    while ($Waited -lt $IntervalSeconds) {
        Start-Sleep -Seconds 60
        $Waited += 60
        $Remaining = [math]::Max(0, ($IntervalSeconds - $Waited) / 60)
        if ($Remaining -gt 0 -and $Remaining -lt 5) {
            Write-Host "   ⏳ $Remaining minutes remaining..." -ForegroundColor DarkGray
        }
    }
}
