import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCreditRecords } from '@/lib/credits';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const records = await getCreditRecords(session.user.phone, limit);
    return NextResponse.json({ records });
  } catch (error) {
    console.error('获取积分记录失败:', error);
    return NextResponse.json({ error: '获取积分记录失败' }, { status: 500 });
  }
}