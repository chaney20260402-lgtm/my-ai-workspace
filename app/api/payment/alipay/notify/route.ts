// app/api/payment/wechat/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { addCredits } from '@/lib/credits';
import { wechatPayConfig } from '@/lib/wechat/config';
import { verifySignature } from '@/lib/wechat/signer';
import crypto from 'crypto';

/**
 * 解密微信回调通知中的 resource 数据
 */
function decryptResource(resource: any, apiV3Key: string): any {
  const { ciphertext, associated_data, nonce } = resource;
  const key = crypto.createHash('sha256').update(apiV3Key).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'base64'));
  decipher.setAuthTag(Buffer.from(associated_data, 'base64'));
  let decrypted = decipher.update(Buffer.from(ciphertext, 'base64'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = req.headers;
  const timestamp = headers.get('wechatpay-timestamp') || '';
  const nonce = headers.get('wechatpay-nonce') || '';
  const signature = headers.get('wechatpay-signature') || '';

  // 验证签名
  if (!verifySignature(body, timestamp, nonce, signature, wechatPayConfig.platformCert)) {
    return NextResponse.json({ code: 'FAIL', message: '签名验证失败' }, { status: 401 });
  }

  const data = JSON.parse(body);
  // 微信回调通知的实际数据在 resource 字段中，且是加密的
  const resource = data.resource;
  let orderInfo;
  try {
    orderInfo = decryptResource(resource, wechatPayConfig.apiV3Key);
  } catch (error) {
    console.error('解密回调数据失败:', error);
    return NextResponse.json({ code: 'FAIL', message: '解密失败' }, { status: 400 });
  }

  const { out_trade_no, trade_state, amount } = orderInfo;

  if (trade_state === 'SUCCESS') {
    const redis = getRedis();
    const processedKey = `order_processed:${out_trade_no}`;
    const isProcessed = await redis.get(processedKey);
    if (!isProcessed) {
      const orderData = await redis.get(`order:${out_trade_no}`);
      if (orderData) {
        const order = JSON.parse(orderData);
        await addCredits(order.userId, order.credits, `微信支付: ${out_trade_no}`);
        await redis.setex(processedKey, 86400, '1');
      }
    }
  }

  return NextResponse.json({ code: 'SUCCESS', message: '成功' });
}