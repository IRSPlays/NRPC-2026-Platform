# Google Drive Backup for NRPC Platform

Automated backup of your database and files to Google Drive.

## Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "NRPC Backup")
3. Enable the **Google Drive API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Drive API" → Enable it

### 2. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Desktop application**
4. Download the JSON file
5. Rename it to `credentials.json` and save in this folder

### 3. Authorize

```bash
cd google-drive-backup
npm install
node quick-upload.js
```

The first run will show a Google authorization URL. Open it in your browser, grant access, and paste the code back.

This creates `token.json` for future automatic backups.

### 4. Test Upload

```bash
# Upload latest backup
node quick-upload.js

# Upload ALL backups
node quick-upload.js --all
```

## Automated Backups

### Option A: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every 4 hours)
4. Action: Start a program
5. Program: `node`
6. Arguments: `C:\path\to\nrpc-platform\google-drive-backup\quick-upload.js`
7. Start in: `C:\path\to\nrpc-platform\google-drive-backup`

### Option B: Run with Server

Add this to your server code to upload after each auto-backup:

```javascript
import { performBackup } from './google-drive-backup/backup.js';

// After local backup
await performBackup();
```

## Files

- `credentials.json` - Google OAuth credentials (DO NOT SHARE)
- `token.json` - Generated auth token (safe to commit if private repo)
- `quick-upload.js` - Upload script

## Storage

Your backups will be stored in a Google Drive folder called "NRPC-Backups".

## Restore from Backup

1. Download backup file from Google Drive
2. Extract files
3. Replace `database.sqlite` with the extracted one
