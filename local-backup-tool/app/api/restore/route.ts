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

    const filePath = path.join(process.cwd(), 'backups', filename);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    console.log(`Restoring ${filename} to ${url}...`);

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

  } catch (error: any) {
    console.error('Restore failed:', error.response?.data || error.message);
    return NextResponse.json({ error: error.response?.data?.error || error.message }, { status: 500 });
  }
}
