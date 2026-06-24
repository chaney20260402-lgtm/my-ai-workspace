// app/api/payment/alipay/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRedis } from '@/lib/redis';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// ✅ V4 版本：使用解构赋值
const { AlipaySdk } = require('alipay-sdk');

const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID!,
  gateway: process.env.ALIPAY_GATEWAY!,
  privateKey: process.env.ALIPAY_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!.replace(/\\n/g, '\n'),
});

export async function POST(request: Request) {
  try {
    const { orderId, amount, subject, credits, type } = await request.json();

    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!orderId || !amount || !subject || !credits) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const redis = getRedis();
    await redis.set(
      `order:${orderId}`,
      JSON.stringify({
        userId: session.user.phone,
        credits,
        amount,
        status: 'pending',
        createdAt: Date.now(),
        type: type || 'recharge',
      }),
      { ex: 86400 }
    );

    const result = await alipaySdk.exec('alipay.trade.page.pay', {
      bizContent: {
        outTradeNo: orderId,
        productCode: 'FAST_INSTANT_TRADE_PAY',
        totalAmount: amount.toString(),
        subject: subject,
        body: `订单号: ${orderId}`,
      },
      returnUrl: process.env.ALIPAY_RETURN_URL!,
      notifyUrl: process.env.ALIPAY_NOTIFY_URL!,
    });

    const payUrl = result?.url || result;
    if (!payUrl) throw new Error('生成支付链接失败');

    return NextResponse.json({ success: true, payUrl });
  } catch (error) {
    console.error('支付宝支付创建失败:', error);
    return NextResponse.json({ error: '支付创建失败' }, { status: 500 });
  }
}