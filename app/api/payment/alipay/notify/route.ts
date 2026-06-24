// app/api/payment/alipay/notify/route.ts
import { getRedis } from '@/lib/redis';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// ✅ V4 版本使用解构赋值
const { AlipaySdk } = require('alipay-sdk');

const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID!,
  gateway: process.env.ALIPAY_GATEWAY!,
  privateKey: process.env.ALIPAY_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!.replace(/\\n/g, '\n'),
});

export async function POST(request: Request) {
  try {
    // 1. 获取 Content-Type
    const contentType = request.headers.get('content-type') || '';
    console.log('📩 Content-Type:', contentType);

    // 2. 解析参数
    let params: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const searchParams = new URLSearchParams(text);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        params[key] = value as string;
      });
    } else if (contentType.includes('application/json')) {
      params = await request.json();
    } else {
      // 兜底：尝试作为 URLSearchParams 解析
      const text = await request.text();
      try {
        const searchParams = new URLSearchParams(text);
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
      } catch {
        try {
          params = JSON.parse(text);
        } catch {
          console.error('❌ 无法解析请求体，原始内容:', text);
          return new Response('fail', { status: 200 });
        }
      }
    }

    console.log('📋 解析后的参数:', params);

    // 3. 验签（注释掉可临时跳过验签，仅用于测试）
    const verifyResult = alipaySdk.checkNotifySign(params);
    if (!verifyResult) {
      console.error('❌ 支付宝签名验证失败');
      return new Response('fail', { status: 200 });
    }

    // 4. 检查交易状态
    const tradeStatus = params.trade_status;
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      const outTradeNo = params.out_trade_no;

      // 5. 从 Redis 读取订单
      const redis = getRedis();
      const orderStr = await redis.get(`order:${outTradeNo}`) as string | null;
      if (!orderStr) {
        console.error('❌ 订单不存在:', outTradeNo);
        return new Response('fail', { status: 200 });
      }

      const order = JSON.parse(orderStr);

      // 6. 防止重复处理
      if (order.status === 'paid') {
        console.log('ℹ️ 订单已处理，跳过重复通知');
        return new Response('success', { status: 200 });
      }

      // 7. 更新订单状态
      order.status = 'paid';
      await redis.set(`order:${outTradeNo}`, JSON.stringify(order));

      // 8. 增加用户积分
      const userId = order.userId;
      const creditsToAdd = order.credits;
      const userKey = `user:${userId}`;
      const currentCredits = parseInt((await redis.get(userKey) as string) || '0');
      const newCredits = currentCredits + creditsToAdd;
      await redis.set(userKey, String(newCredits));

      console.log(`✅ 用户 ${userId} 增加 ${creditsToAdd} 积分，当前 ${newCredits}`);
    }

    // 9. 返回成功标识（支付宝要求返回 "success"）
    return new Response('success', { status: 200 });
  } catch (error) {
    console.error('❌ 支付回调处理失败:', error);
    return new Response('fail', { status: 200 });
  }
}

