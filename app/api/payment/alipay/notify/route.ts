// app/api/payment/alipay/notify/route.ts
import { redis } from '@/lib/redis';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AlipaySdk = require('alipay-sdk');

const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID!,
  gateway: process.env.ALIPAY_GATEWAY!,
  privateKey: process.env.ALIPAY_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!.replace(/\\n/g, '\n'),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value as string;
    });

    const verifyResult = alipaySdk.checkNotifySign(params);
    if (!verifyResult) {
      console.error('❌ 支付宝签名验证失败');
      return new Response('fail', { status: 200 });
    }

    const tradeStatus = params.trade_status;
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      const outTradeNo = params.out_trade_no;

      const orderStr = await redis.get(`order:${outTradeNo}`) as string | null;
      if (!orderStr) {
        console.error('❌ 订单不存在:', outTradeNo);
        return new Response('fail', { status: 200 });
      }

      const order = JSON.parse(orderStr);
      if (order.status === 'paid') {
        console.log('ℹ️ 订单已处理，跳过');
        return new Response('success', { status: 200 });
      }

      order.status = 'paid';
      await redis.set(`order:${outTradeNo}`, JSON.stringify(order));

      const userId = order.userId;
      const creditsToAdd = order.credits;
      const userKey = `user:${userId}`;
      const currentCredits = parseInt((await redis.get(userKey) as string) || '0');
      const newCredits = currentCredits + creditsToAdd;
      await redis.set(userKey, String(newCredits));

      console.log(`✅ 用户 ${userId} 增加 ${creditsToAdd} 积分，当前 ${newCredits}`);
    }

    return new Response('success', { status: 200 });
  } catch (error) {
    console.error('❌ 支付回调处理失败:', error);
    return new Response('fail', { status: 200 });
  }
}