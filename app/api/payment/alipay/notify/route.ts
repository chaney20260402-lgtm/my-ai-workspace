// app/api/payment/alipay/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { addCredits } from '@/lib/credits';
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

    // 4. 增加积分
    await addCredits(order.userId, order.credits, `支付宝支付: ${orderId}`);

    // 5. 标记订单已处理
    await redis.setex(processedKey, 86400, '1');

    console.log(`✅ 支付宝回调处理成功: 用户 ${order.userId} 获得 ${order.credits} 积分`);

    return NextResponse.json({ message: 'success' });
  } catch (error) {
    console.error('❌ 回调处理失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}
