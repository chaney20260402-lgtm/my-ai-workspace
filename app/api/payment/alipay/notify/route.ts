// app/api/payment/alipay/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { createVerify } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    console.log('📥 收到支付宝回调:', params);

    // ============================================================
    // 手动验签（替代 alipay-sdk 的 checkNotifySign）
    // ============================================================
    const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY!;
    const sign = params.sign;
    if (!sign) {
      console.error('❌ 缺少签名');
      return NextResponse.json({ error: '签名缺失' }, { status: 400 });
    }

    // 移除 sign 和 sign_type
    const verifyParams = { ...params };
    delete verifyParams.sign;
    delete verifyParams.sign_type;

    // 按参数名排序并拼接
    const sortedKeys = Object.keys(verifyParams).sort();
    const signStr = sortedKeys
      .map(key => `${key}=${verifyParams[key]}`)
      .join('&');

    const verifier = createVerify('RSA-SHA256');
    verifier.update(signStr);
    verifier.end();
    const isValid = verifier.verify(
      alipayPublicKey.replace(/\\n/g, '\n'),
      sign,
      'base64'
    );

    if (!isValid) {
      console.error('❌ 支付宝签名验证失败');
      return NextResponse.json({ error: '签名验证失败' }, { status: 400 });
    }
    console.log('✅ 签名验证通过');

    // 后续逻辑不变：判断交易状态、处理订单、更新积分和会员...
    const tradeStatus = params.trade_status;
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      console.log(`⏳ 交易状态: ${tradeStatus}，非成功状态，忽略`);
      return NextResponse.json({ message: 'success' });
    }

    const orderId = params.out_trade_no;
    const redis = getRedis();
    const processedKey = `order_processed:${orderId}`;
    const isProcessed = await redis.get(processedKey);
    if (isProcessed) {
      console.log(`⏳ 订单 ${orderId} 已处理，跳过重复回调`);
      return NextResponse.json({ message: 'success' });
    }

    const orderData = await redis.get(`order:${orderId}`);
    if (!orderData) {
      console.error(`❌ 订单 ${orderId} 不存在`);
      return NextResponse.json({ message: 'success' });
    }
    const order = JSON.parse(orderData);

    // 更新用户积分和会员类型
    const user = await prisma.user.findUnique({
      where: { phone: order.userId },
    });
    if (!user) {
      console.error(`❌ 用户 ${order.userId} 不存在`);
      return NextResponse.json({ message: 'success' });
    }

    const newCredits = (user.credits || 0) + order.credits;
    let newMembershipType = user.membershipType || 'experience';
    if (order.membershipType) {
      newMembershipType = order.membershipType;
    }

    console.log(`🔄 准备更新用户: phone=${order.userId}, 新积分=${newCredits}, 新会员=${newMembershipType}`);
    const updatedUser = await prisma.user.update({
      where: { phone: order.userId },
      data: {
        credits: newCredits,
        membershipType: newMembershipType,
      },
    });
    console.log(`✅ 更新后用户:`, updatedUser);

    // 更新 Redis
    await redis.set(`user:${order.userId}`, String(newCredits));

    const recordKey = `credit_records:${order.userId}`;
    const record = JSON.stringify({
      amount: order.credits,
      type: 'recharge',
      description: `支付宝充值 ${order.credits} 积分 ${order.membershipType ? `+ 会员 ${order.membershipType}` : ''}`,
      createdAt: new Date().toISOString(),
    });
    await redis.lpush(recordKey, record);
    await redis.ltrim(recordKey, 0, 99);

    await redis.setex(processedKey, 86400, '1');

    console.log(`✅ 用户 ${order.userId} 充值成功: +${order.credits} 积分，会员 ${newMembershipType}`);

    return NextResponse.json({ message: 'success' });
  } catch (error) {
    console.error('❌ 回调处理失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}
