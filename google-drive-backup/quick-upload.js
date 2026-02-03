/**
 * Quick Google Drive Upload for NRPC Backups
 * 
 * Usage:
 *   node quick-upload.js              # Upload latest backup
 *   node quick-upload.js --all         # Upload all backups
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.log('ERROR: credentials.json not found!');
    console.log('\nSetup: https://console.cloud.google.com/');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
}

async function getAuth() {
  const credentials = loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    oauth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    return oauth2Client;
  }

  console.log('Authorize Google Drive access:\n');
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
  });
  
  console.log(authUrl);
  console.log('\nPaste authorization code here:');
  
  return new Promise((resolve, reject) => {
    process.stdin.once('data', async (code) => {
      try {
        const { tokens } = await oauth2Client.getToken(code.toString().trim());
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log('Token saved!');
        oauth2Client.setCredentials(tokens);
        resolve(oauth2Client);
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function uploadFile(drive, filePath, folderId) {
  const filename = path.basename(filePath);
  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: folderId ? [folderId] : undefined
    },
    media: {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(filePath)
    },
    fields: 'id,name,webContentLink'
  });
  return response.data;
}

async function getFolder(drive) {
  const response = await drive.files.list({
    q: "name='NRPC-Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id,name)'
  });
  
  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }
  
  const folder = await drive.files.create({
    requestBody: { name: 'NRPC-Backups', mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id'
  });
  return folder.data.id;
}

async function main() {
  const uploadAll = process.argv.includes('--all');
  
  console.log('NRPC Google Drive Backup\n');
  
  const drive = google.drive({ version: 'v3', auth: await getAuth() });
  const folderId = await getFolder(drive);
  
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log('ERROR: No backups folder found');
    process.exit(1);
  }
  
  let files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup-'))
    .sort()
    .reverse();
  
  if (!uploadAll && files.length > 0) {
    files = [files[0]];
  }
  
  if (files.length === 0) {
    console.log('No backup files found');
    process.exit(1);
  }
  
  console.log(`Uploading ${files.length} file(s)...\n`);
  
  for (const file of files) {
    const filePath = path.join(backupDir, file);
    const result = await uploadFile(drive, filePath, folderId);
    console.log(`Uploaded: ${file}`);
    console.log(`URL: ${result.webContentLink}\n`);
  }
  
  console.log('Backup complete!');
}

main().catch(console.error);
