// app/api/payment/alipay/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { addCredits } from '@/lib/credits';
import { prisma } from '@/lib/prisma';
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
      timeout: 30000,
    });
  }
  return alipaySdkInstance;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    console.log('📥 收到支付宝回调:', params);

    const alipaySdk = getAlipaySdk();

    // 1. 验证签名
    const isValid = alipaySdk.checkNotifySign(params);
    if (!isValid) {
      console.error('❌ 支付宝签名验证失败');
      return NextResponse.json({ error: '签名验证失败' }, { status: 400 });
    }

    const tradeStatus = params.trade_status;
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      console.log(`⏳ 交易状态: ${tradeStatus}，非成功状态，忽略`);
      return NextResponse.json({ message: 'success' });
    }

    const orderId = params.out_trade_no;

    const redis = getRedis();
    const processedKey = `order_processed:${orderId}`;

    // 2. 幂等处理
    const isProcessed = await redis.get(processedKey);
    if (isProcessed) {
      console.log(`⏳ 订单 ${orderId} 已处理，跳过重复回调`);
      return NextResponse.json({ message: 'success' });
    }

    // 3. 获取订单信息
    const orderData = await redis.get(`order:${orderId}`);
    if (!orderData) {
      console.error(`❌ 订单 ${orderId} 不存在`);
      return NextResponse.json({ message: 'success' });
    }
    const order = JSON.parse(orderData);

    // ============================================================
    // ✅ 4. 同时更新 PostgreSQL 和 Redis（积分 + 会员类型）
    // ============================================================
    
    // 4.1 更新 PostgreSQL
    const user = await prisma.user.findUnique({
      where: { phone: order.userId },
    });

    if (!user) {
      console.error(`❌ 用户 ${order.userId} 不存在`);
      return NextResponse.json({ message: 'success' });
    }

    const newCredits = (user.credits || 0) + order.credits;
    let newMembershipType = user.membershipType || 'experience';

    // 如果是会员套餐，更新会员类型
    if (order.membershipType) {
      newMembershipType = order.membershipType;
    }

    // 更新 PostgreSQL
    await prisma.user.update({
      where: { phone: order.userId },
      data: {
        credits: newCredits,
        membershipType: newMembershipType,
      },
    });

    // 4.2 更新 Redis（同步积分）
    await redis.set(`user:${order.userId}`, String(newCredits));

    // 4.3 记录积分变动
    const recordKey = `credit_records:${order.userId}`;
    const record = JSON.stringify({
      amount: order.credits,
      type: 'recharge',
      description: `支付宝充值 ${order.credits} 积分 ${order.membershipType ? `+ 会员 ${order.membershipType}` : ''}`,
      createdAt: new Date().toISOString(),
    });
    await redis.lpush(recordKey, record);
    await redis.ltrim(recordKey, 0, 99);

    // 5. 标记订单已处理
    await redis.setex(processedKey, 86400, '1');

    console.log(`✅ 用户 ${order.userId} 充值成功: +${order.credits} 积分，新积分 ${newCredits}，会员 ${newMembershipType}`);

    return NextResponse.json({ message: 'success' });
  } catch (error) {
    console.error('❌ 回调处理失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}
