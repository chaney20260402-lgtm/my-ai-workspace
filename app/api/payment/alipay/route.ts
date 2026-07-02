// app/api/payment/alipay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRedis } from '@/lib/redis';
import { createRequire } from 'module';

let alipaySdkInstance: any = null;

function getAlipaySdk() {
  if (!alipaySdkInstance) {
    const require = createRequire(import.meta.url);
    const { AlipaySdk } = require('alipay-sdk');
    const privateKey = process.env.ALIPAY_PRIVATE_KEY;
    const publicKey = process.env.ALIPAY_PUBLIC_KEY;
    if (!privateKey || !publicKey) {
      throw new Error('支付宝密钥未配置');
    }
    alipaySdkInstance = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID!,
      gateway: process.env.ALIPAY_GATEWAY!,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      alipayPublicKey: publicKey.replace(/\\n/g, '\n'),
      timeout: 30000, // 30秒超时
    });
  }
  return alipaySdkInstance;
}

export async function POST(request: NextRequest) {
  try {
    const alipaySdk = getAlipaySdk();
    const body = await request.json();
    console.log('📥 收到支付请求，参数:', body);

    const { orderId, amount, subject, credits, type } = body;

    if (!orderId || !amount || !subject || credits === undefined || typeof credits !== 'number') {
      console.error('❌ 缺少必要参数:', { orderId, amount, subject, credits });
      return NextResponse.json(
        { error: '缺少必要参数或 credits 无效' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const userId = session.user.phone;

    // 确保订单存在（如果没有则创建，兼容模拟模式）
    const redis = getRedis();
    const orderKey = `order:${orderId}`;
    let orderData = await redis.get(orderKey);
    if (!orderData) {
      console.warn(`⚠️ 订单 ${orderId} 不存在，使用前端参数创建临时订单`);
      orderData = JSON.stringify({
        userId,
        credits,
        amount,
        status: 'pending',
        createdAt: Date.now(),
      });
      await redis.setex(orderKey, 3600, orderData);
    }
    const order = JSON.parse(orderData);

    // 验证订单用户
    if (order.userId !== userId) {
      console.error(`❌ 订单用户不匹配: ${order.userId} vs ${userId}`);
      return NextResponse.json({ error: '订单用户不匹配' }, { status: 403 });
    }

    // 调用支付宝统一收单接口
    console.log(`📤 调用支付宝支付: ${orderId}, 金额: ${amount}, 主题: ${subject}`);
    const result = await alipaySdk.exec('alipay.trade.page.pay', {
      bizContent: {
        out_trade_no: orderId,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: amount.toString(),
        subject: subject,
        body: `订单号: ${orderId}`,
      },
      returnUrl: process.env.ALIPAY_RETURN_URL!,
      notifyUrl: process.env.ALIPAY_NOTIFY_URL!,
    });

    const payUrl = result?.url || result;
    if (!payUrl) throw new Error('生成支付链接失败');

    console.log(`✅ 支付宝支付链接生成成功: ${payUrl}`);

    return NextResponse.json({
      success: true,
      payUrl,
      orderId,
    });
  } catch (error: any) {
    console.error('❌ 支付宝支付创建失败:', error);
    return NextResponse.json(
      { error: error.message || '支付创建失败' },
      { status: 500 }
    );
  }
}