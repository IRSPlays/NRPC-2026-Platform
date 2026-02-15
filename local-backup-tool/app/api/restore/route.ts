import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

export async function POST(req: Request) {
  try {
    const { url, key, filename } = await req.json();

    if (!url || !key || !filename) {
      return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
    }

    // Search for the file in multiple locations
    const possibleDirs = [
      path.join(process.cwd(), 'backups'),
      path.join(process.cwd(), 'data', 'backups'),
      path.join(process.cwd(), '..', 'backups'),
      path.join(process.cwd(), '..', 'data', 'backups'),
    ];

    let filePath = null;
    for (const dir of possibleDirs) {
      const p = path.join(dir, filename);
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Backup file not found on local drive' }, { status: 404 });
    }

    console.log(`Restoring ${filename} to ${url}...`);

    if (filename.endsWith('.zip')) {
      // Full System Restore
      const form = new FormData();
      form.append('backup', fs.createReadStream(filePath));

      const response = await axios.post(`${url}/api/admin/system/restore`, form, {
        headers: {
          'x-backup-key': key,
          ...form.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      return NextResponse.json({ success: true, data: response.data });
    } else if (filename.endsWith('.json')) {
      // Legacy JSON Restore
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // We need an endpoint on the main server that accepts JSON via x-backup-key
      // For now, let's assume we use the existing /api/backup/restore but that needs requireAdmin
      // Alternatively, we add a new endpoint or update /api/admin/system/restore to handle JSON.
      
      const response = await axios.post(`${url}/api/admin/system/restore-json`, 
        { backupData: jsonData },
        { headers: { 'x-backup-key': key } }
      );

      return NextResponse.json({ success: true, data: response.data });
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Restore failed:', error.response?.data || error.message);
    return NextResponse.json({ error: error.response?.data?.error || error.message }, { status: 500 });
  }
}
