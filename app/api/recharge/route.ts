// app/api/recharge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRedis } from '@/lib/redis';
import { addCredits } from '@/lib/credits';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const userId = session.user.phone;

    const { amount, plan } = await req.json();

    // 校验参数
    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: '无效的积分数量' }, { status: 400 });
    }

    const redis = getRedis();

    // ---------- 体验包限制逻辑（含并发优化） ----------
    // ---------- 体验包限制逻辑（先检查再设置） ----------
if (plan === '体验包' || plan === '体验会员') {
  const freeKey = `free_plan:${userId}`;
  
  // 先检查是否已领取
  const alreadyClaimed = await redis.get(freeKey);
  if (alreadyClaimed) {
    return NextResponse.json(
      { error: '您已领取过体验包，不可重复领取' },
      { status: 400 }
    );
  }
  
  // 未领取，记录领取状态
  await redis.set(freeKey, '1');
}
    // 增加积分
    const newCredits = await addCredits(userId, amount, plan);

    return NextResponse.json({
      success: true,
      credits: newCredits,
    });
  } catch (error: any) {
    console.error('充值失败:', error);
    return NextResponse.json(
      { error: error.message || '充值失败，请重试' },
      { status: 500 }
    );
  }
}