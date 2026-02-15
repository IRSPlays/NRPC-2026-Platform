import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

export async function POST(req: Request) {
  try {
    const { url, key } = await req.json();
    
    if (!url || !key) {
      return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.zip`;
    const savePath = path.join(process.cwd(), 'backups', fileName);

    // Ensure directory exists
    if (!fs.existsSync(path.dirname(savePath))) {
      fs.mkdirSync(path.dirname(savePath), { recursive: true });
    }

    console.log(`Starting sync from ${url}...`);

    const response = await axios({
      method: 'GET',
      url: `${url}/api/admin/system/export`,
      headers: { 'x-backup-key': key },
      responseType: 'stream',
    });

    await pipeline(response.data, fs.createWriteStream(savePath));

    // Get file stats
    const stats = fs.statSync(savePath);

    return NextResponse.json({ 
      success: true, 
      file: fileName, 
      size: stats.size,
      message: 'Backup synchronized successfully' 
    });

  } catch (error: any) {
    console.error('Sync failed:', error.message);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
