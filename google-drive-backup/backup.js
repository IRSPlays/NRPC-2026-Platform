/**
 * Google Drive Backup for NRPC Platform
 * 
 * Setup Instructions:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project
 * 3. Enable Google Drive API
 * 4. Create OAuth 2.0 credentials (Desktop application)
 * 5. Download credentials.json and save here as 'credentials.json'
 * 6. Run 'node auth.js' to generate token.json
 * 
 * First run will open browser for OAuth consent.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Database and backup paths
const DB_PATH = process.env.DB_PATH || './database.sqlite';
const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';

// SCOPES for Google Drive
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file'
];

/**
 * Load credentials from file
 */
function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(`Credentials file not found: ${CREDENTIALS_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
}

/**
 * Load or generate OAuth2 token
 */
async function getAuthenticatedClient() {
  const credentials = loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have a token
  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));
    return oAuth2Client;
  }

  // Generate new token
  console.log('🔗 Open this URL in browser to authorize:');
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log(authUrl);
  
  return new Promise((resolve, reject) => {
    console.log('\n📝 Enter the authorization code:');
    process.stdin.once('data', async (data) => {
      const code = data.toString().trim();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log('✅ Token saved to token.json');
        oAuth2Client.setCredentials(tokens);
        resolve(oAuth2Client);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Create a backup zip file
 */
async function createBackup(drive) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `nrpc-backup-${timestamp}.zip`;
  const backupPath = path.join(BACKUP_DIR, backupFilename);
  
  // Check if 7zip is available, otherwise create tar or just copy files
  // For simplicity, we'll copy the database and create a manifest
  
  console.log('📦 Creating backup...');
  
  // Copy database
  if (fs.existsSync(DB_PATH)) {
    const dbContent = fs.readFileSync(DB_PATH);
    fs.writeFileSync(path.join(BACKUP_DIR, `database-${timestamp}.sqlite`), dbContent);
  }
  
  // Create backup info
  const backupInfo = {
    timestamp: new Date().toISOString(),
    database: fs.existsSync(DB_PATH) ? 'included' : 'not found',
    uploads_count: fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR).length : 0
  };
  
  fs.writeFileSync(
    path.join(BACKUP_DIR, `backup-info-${timestamp}.json`),
    JSON.stringify(backupInfo, null, 2)
  );
  
  // List files to potentially upload
  const filesToBackup = [];
  if (fs.existsSync(DB_PATH)) {
    filesToBackup.push({
      name: `database-${timestamp}.sqlite`,
      path: path.join(BACKUP_DIR, `database-${timestamp}.sqlite`)
    });
  }
  
  filesToBackup.push({
    name: `backup-info-${timestamp}.json`,
    path: path.join(BACKUP_DIR, `backup-info-${timestamp}.json`)
  });
  
  return { files: filesToBackup, timestamp };
}

/**
 * Upload file to Google Drive
 */
async function uploadFile(drive, filePath, name, folderId = null) {
  const fileMetadata = {
    name: name,
    parents: folderId ? [folderId] : undefined
  };
  
  const media = {
    mimeType: 'application/octet-stream',
    body: fs.createReadStream(filePath)
  };
  
  console.log(`  📤 Uploading ${name}...`);
  
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id,name,webViewLink'
  });
  
  console.log(`  ✅ Uploaded: ${name} (${response.data.webViewLink})`);
  return response.data;
}

/**
 * Create NRPC Backup folder if not exists
 */
async function getOrCreateBackupFolder(drive) {
  // Search for existing folder
  const response = await drive.files.list({
    q: "name='NRPC Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id,name)'
  });
  
  if (response.data.files.length > 0) {
    console.log(`📁 Found backup folder: ${response.data.files[0].name}`);
    return response.data.files[0].id;
  }
  
  // Create new folder
  console.log('📁 Creating NRPC Backups folder...');
  const folder = await drive.files.create({
    requestBody: {
      name: 'NRPC Backups',
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id,name'
  });
  
  console.log(`✅ Created folder: ${folder.data.name}`);
  return folder.data.id;
}

/**
 * Main backup function
 */
async function performBackup() {
  console.log('🚀 Starting Google Drive backup...\n');
  
  try {
    // Authenticate
    console.log('🔐 Authenticating with Google...');
    const auth = await getAuthenticatedClient();
    const drive = google.drive({ version: 'v3', auth });
    
    // Get or create backup folder
    const folderId = await getOrCreateBackupFolder(drive);
    
    // Create local backup files
    const { files, timestamp } = await createBackup(drive);
    
    // Upload each file
    console.log(`\n☁️  Uploading to Google Drive (${files.length} files)...\n`);
    
    for (const file of files) {
      await uploadFile(drive, file.path, file.name, folderId);
    }
    
    console.log('\n✅ Backup complete!');
    console.log(`📁 View backups: https://drive.google.com/drive/folders/${folderId}`);
    
  } catch (err) {
    console.error('❌ Backup failed:', err.message);
    process.exit(1);
  }
}

// Export for use as module
export { performBackup, uploadFile, getOrCreateBackupFolder };

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  performBackup();
}
