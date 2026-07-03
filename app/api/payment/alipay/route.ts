// app/api/payment/wechat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRedis } from '@/lib/redis';
import { wechatPayConfig } from '@/lib/wechat/config';
import { wechatRequest } from '@/lib/wechat/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.phone) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { planId, credits, amount, subject } = await req.json();
  const orderId = `WX_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 保存订单到Redis
  const redis = getRedis();
  await redis.setex(`order:${orderId}`, 3600, JSON.stringify({
    userId: session.user.phone,
    credits,
    amount,
    status: 'pending',
  }));

  // 获取客户端真实 IP（优先从代理头获取）
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   '127.0.0.1';

  // 调用微信支付API（H5支付）
  const result = await wechatRequest(
    'POST',
    '/v3/pay/transactions/h5',
    {
      appid: wechatPayConfig.appid,
      mchid: wechatPayConfig.mchid,
      description: subject,
      out_trade_no: orderId,
      notify_url: wechatPayConfig.notifyUrl,
      amount: {
        total: Math.round(amount * 100), // 微信金额单位：分
        currency: 'CNY',
      },
      scene_info: {
        payer_client_ip: clientIp,
        h5_info: {
          type: 'Wap',
        },
      },
    }
  );

  // H5支付返回 h5_url，前端跳转该链接
  return NextResponse.json({
    success: true,
    payUrl: result.h5_url,
    orderId,
  });
}