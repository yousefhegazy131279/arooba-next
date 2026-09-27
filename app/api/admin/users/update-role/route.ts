import { NextResponse } from 'next/server';
import { updateUserRole } from '@/app/admin/actions';
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    const { userId, newRole } = await request.json();
    return NextResponse.json(await updateUserRole(userId, newRole));
  } catch { return NextResponse.json({ error: 'تعذر تحديث الصلاحية' }, { status: 403 }); }
}

