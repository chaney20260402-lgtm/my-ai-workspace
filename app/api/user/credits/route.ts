import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserCredits } from '@/lib/credits';  // ✅ 替换

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

   const credits = await getUserCredits(session.user.phone);
    return NextResponse.json({ credits });
  } catch (error) {
    console.error('获取积分失败:', error);
    return NextResponse.json({ error: '获取积分失败' }, { status: 500 });
  }
}