// app/api/payment/order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

type PlanConfig = {
  name: string;
  price: number;
  credits: number;
  membershipType?: string | null;
};

const PLANS: Record<string, PlanConfig> = {
  // --- 原有套餐（补充 membershipType）---
  plan_basic: {
    name: '体验会员',
    price: 0,
    credits: 100,
    membershipType: null,
  },
  plan_pro: {
    name: '进阶会员',
    price: 200,
    credits: 1500,
    membershipType: 'advanced',
  },
  plan_enterprise: {
    name: '专业会员',
    price: 1000,
    credits: 7500,
    membershipType: 'professional',
  },
  recharge_1000: {
    name: '1000积分',
    price: 200,
    credits: 1000,
    membershipType: null,
  },
  recharge_5000: {
    name: '5000积分',
    price: 800,
    credits: 5000,
    membershipType: null,
  },
  recharge_10000: {
    name: '10000积分',
    price: 1500,
    credits: 10000,
    membershipType: null,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { planId, userId } = await req.json();
    console.log('📥 收到订单请求:', { planId, userId });

    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const plan = PLANS[planId];
    if (!plan) {
      console.error(`❌ 无效的套餐: ${planId}`);
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
    }

    const orderId = `MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const amount = plan.price;
    const subject = plan.name;

    const redis = getRedis();

    // ✅ 存储订单时包含 membershipType
    const orderData = {
      userId,
      planId,
      amount,
      credits: plan.credits,
      membershipType: plan.membershipType || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await redis.setex(`order:${orderId}`, 3600, JSON.stringify(orderData));

    console.log(`📦 订单创建成功: ${orderId}, 用户: ${userId}, 积分: ${plan.credits}, 会员类型: ${orderData.membershipType}`);

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      subject,
      credits: plan.credits,
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}