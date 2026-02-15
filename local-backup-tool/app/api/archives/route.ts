import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('--- ARCHIVE LISTING REQUEST ---');
  try {
    const possibleDirs = [
      path.join(process.cwd(), 'backups'),
      path.join(process.cwd(), 'data', 'backups'),
      path.join(process.cwd(), '..', 'backups'),
      path.join(process.cwd(), '..', 'data', 'backups'),
      '/app/data/backups',
      path.join(process.env.HOME || '', 'NRPCPlatform/NRPC-2026-Platform/data/backups'),
    ];

    let allFiles = [];

    for (const dir of possibleDirs) {
      if (fs.existsSync(dir)) {
        console.log(`Found directory: ${dir}`);
        try {
          const files = fs.readdirSync(dir)
            .filter(f => f.startsWith('backup-') && (f.endsWith('.zip') || f.endsWith('.json')))
            .map(f => {
              const fullPath = path.join(dir, f);
              const stats = fs.statSync(fullPath);
              return {
                name: f,
                size: stats.size,
                date: stats.mtime
              };
            });
          allFiles = [...allFiles, ...files];
        } catch (e: any) {
          console.error(`Error reading ${dir}:`, e.message);
        }
      }
    }

    const uniqueFiles = Array.from(new Map(allFiles.map(file => [file.name, file])).values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`Returning ${uniqueFiles.length} archives`);
    return NextResponse.json(uniqueFiles);
  } catch (error: any) {
    console.error('List archives failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
