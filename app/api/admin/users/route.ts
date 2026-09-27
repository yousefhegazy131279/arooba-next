import { NextResponse } from 'next/server';
import { getUsers } from '@/app/admin/actions';
export async function GET() {
  try { return NextResponse.json(await getUsers(), { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch { return NextResponse.json({ error: 'غير مصرح أو تعذر تحميل المستخدمين' }, { status: 403 }); }
}

