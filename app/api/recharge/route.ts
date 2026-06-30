import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { addCredits } from '@/lib/credits';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { amount, plan } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '充值金额无效' }, { status: 400 });
    }

    // 调用 addCredits，写入充值记录
    const newCredits = await addCredits(
      session.user.phone,
      amount,
      plan ? `会员充值（${plan}）` : `充值 ${amount} 积分`
    );

    return NextResponse.json({
      success: true,
      credits: newCredits,
      message: `成功充值 ${amount} 积分`,
    });
  } catch (error: any) {
    console.error('充值失败:', error);
    return NextResponse.json(
      { error: error.message || '充值失败，请重试' },
      { status: 500 }
    );
  }
}