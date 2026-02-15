import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { code } = await req.json();
  const CORRECT_CODE = process.env.LOCAL_ACCESS_CODE || 'admin'; // Default fallback

  if (code === CORRECT_CODE) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: 'Invalid Access Code' }, { status: 401 });
  }
}
