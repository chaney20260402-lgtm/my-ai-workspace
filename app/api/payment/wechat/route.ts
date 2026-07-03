// app/api/payment/wechat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRedis } from '@/lib/redis';
import { wechatPayConfig } from '@/lib/wechat/config';
import { wechatRequest } from '@/lib/wechat/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await req.json();
    console.log('📥 微信支付请求:', body);

    const { planId, credits, amount, subject } = body;

    // 参数校验
    if (!planId || !credits || !amount || !subject) {
      console.error('❌ 缺少必要参数:', { planId, credits, amount, subject });
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const orderId = `WX_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const redis = getRedis();
    await redis.setex(`order:${orderId}`, 3600, JSON.stringify({
      userId: session.user.phone,
      credits,
      amount,
      status: 'pending',
    }));

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     '127.0.0.1';

    console.log(`📤 调用微信支付API: ${orderId}, 金额: ${amount}, IP: ${clientIp}`);

    const result = await wechatRequest('POST', '/v3/pay/transactions/h5', {
      appid: wechatPayConfig.appid,
      mchid: wechatPayConfig.mchid,
      description: subject,
      out_trade_no: orderId,
      notify_url: wechatPayConfig.notifyUrl,
      amount: {
        total: Math.round(amount * 100),
        currency: 'CNY',
      },
      scene_info: {
        payer_client_ip: clientIp,
        h5_info: {
          type: 'Wap',
        },
      },
    });

    console.log('✅ 微信支付API响应:', result);

    if (!result?.h5_url) {
      console.error('❌ 微信支付返回异常，无 h5_url:', result);
      return NextResponse.json({ error: '支付创建失败，未返回支付链接' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payUrl: result.h5_url,
      orderId,
    });
  } catch (error: any) {
    console.error('❌ 微信支付创建失败:', error);
    return NextResponse.json(
      { error: error.message || '支付创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}
