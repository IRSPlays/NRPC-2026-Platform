@echo off
REM NRPC Platform - Automated Google Drive Backup
REM Runs every 5 minutes with automatic restart
REM Run with: npx ts-node backup-runner.ts
REM Or compile and run: tsc backup-runner.ts && node backup-runner.js

echo ============================================
echo   NRPC Platform - Auto Backup (Every 5 mins)
echo ============================================
echo.

REM Configuration
set BACKUP_INTERVAL=300000  REM 5 minutes in milliseconds
set MAX_RETRIES=3
set RETRY_DELAY=5000       REM 5 seconds between retries
set LOG_FILE=logs\backup-runner.log

REM Create logs directory if not exists
if not exist logs mkdir logs

echo [%date% %time%] Starting backup runner... >> %LOG_FILE%

:LOOP
    echo [%date% %time%] Running backup... >> %LOG_FILE%
    echo Running Google Drive backup...
    
    REM Try backup with retries
    set RETRY_COUNT=0
    :RETRY
    set /a RETRY_COUNT+=1
    if %RETRY_COUNT% gtr %MAX_RETRIES% (
        echo [%date% %time%] ERROR: Max retries exceeded >> %LOG_FILE%
        echo Failed after %MAX_RETRIES% attempts
    ) else (
        node quick-upload.js >> %LOG_FILE% 2>&1
        if errorlevel 1 (
            echo [%date% %time%] Attempt %RETRY_COUNT% failed, retrying in %RETRY_DELAY%ms >> %LOG_FILE%
            echo Attempt %RETRY_COUNT% failed, retrying...
            ping -n %RETRY_DELAY% nul >nul 2>&1
            goto RETRY
        ) else (
            echo [%date% %time%] Backup completed successfully >> %LOG_FILE%
            echo Backup completed successfully!
        )
    )
    
    echo [%date% %time%] Waiting 5 minutes until next backup... >> %LOG_FILE%
    echo Waiting 5 minutes until next backup...
    
    REM Wait 5 minutes (300 seconds)
    ping -n 301 127.0.0.1 >nul 2>&1
    
    goto LOOP
