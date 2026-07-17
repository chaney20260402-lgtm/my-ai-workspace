// app/api/payment/alipay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRedis } from '@/lib/redis';
import { createSign } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 收到支付请求，参数:', body);

    const { orderId, amount, subject, credits, type } = body;

    if (!orderId || !amount || !subject || credits === undefined || typeof credits !== 'number') {
      console.error('❌ 缺少必要参数:', { orderId, amount, subject, credits });
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const userId = session.user.phone;

    // 确保订单存在
    const redis = getRedis();
    const orderKey = `order:${orderId}`;
    let orderData = await redis.get(orderKey);
    if (!orderData) {
      console.warn(`⚠️ 订单 ${orderId} 不存在，使用前端参数创建临时订单`);
      orderData = JSON.stringify({
        userId,
        credits,
        amount,
        membershipType: body.membershipType || null,  // ✅ 新增
        status: 'pending',
        createdAt: Date.now(),
      });
      await redis.setex(orderKey, 3600, orderData);
    }
    const order = JSON.parse(orderData);
    if (order.userId !== userId) {
      console.error(`❌ 订单用户不匹配: ${order.userId} vs ${userId}`);
      return NextResponse.json({ error: '订单用户不匹配' }, { status: 403 });
    }

    // ========== 手动构造支付宝请求 ==========
    const appId = process.env.ALIPAY_APP_ID!;
    const gateway = process.env.ALIPAY_GATEWAY!;
    const privateKey = process.env.ALIPAY_PRIVATE_KEY!;
    const returnUrl = process.env.ALIPAY_RETURN_URL!;
    const notifyUrl = process.env.ALIPAY_NOTIFY_URL!;

    console.log(`📤 手动调用支付宝支付: ${orderId}, 金额: ${amount}, 主题: ${subject}`);

    // ---------- 生成正确格式的时间戳 (yyyy-MM-dd HH:mm:ss) ----------
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = 
      now.getFullYear() + '-' +
      pad(now.getMonth() + 1) + '-' +
      pad(now.getDate()) + ' ' +
      pad(now.getHours()) + ':' +
      pad(now.getMinutes()) + ':' +
      pad(now.getSeconds());

    // 1. 构建请求参数（公共参数）
    const params: Record<string, string> = {
      app_id: appId,
      method: 'alipay.trade.page.pay',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: timestamp,  // ← 使用正确格式的时间戳
      version: '1.0',
      notify_url: notifyUrl,
      return_url: returnUrl,
    };

    // 2. 业务参数（bizContent）
    const bizContent = {
      out_trade_no: orderId,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: amount.toString(),
      subject: subject,
    };
    params.biz_content = JSON.stringify(bizContent);

    // 3. 按参数名排序并生成待签名字符串
    const sortedKeys = Object.keys(params).sort();
    let signStr = '';
    for (const key of sortedKeys) {
      if (key === 'sign') continue;
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        if (signStr) signStr += '&';
        signStr += `${key}=${value}`;
      }
    }
    console.log('🔑 待签名字符串:', signStr);

    // 4. 使用私钥签名（RSA-SHA256）
    const sign = createSign('RSA-SHA256');
    sign.update(signStr);
    sign.end();
    const signature = sign.sign(privateKey, 'base64');
    params.sign = signature;

    // 5. 构建最终请求 URL
    const queryParams = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    const payUrl = `${gateway}?${queryParams}`;

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
