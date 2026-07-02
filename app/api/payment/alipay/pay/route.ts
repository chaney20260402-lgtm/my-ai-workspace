// app/api/payment/alipay/pay/route.ts
import { NextRequest, NextResponse } from 'next/server';
// 使用 require 方式加载 alipay-sdk（兼容 CommonJS）
const AlipaySdk = require('alipay-sdk');

// 沙箱环境使用沙箱网关
const isSandbox = process.env.ALIPAY_GATEWAY?.includes('sandbox') ?? true;

const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID!,
  privateKey: process.env.ALIPAY_PRIVATE_KEY!,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!,
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
});

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, subject } = await req.json();

    const result = await alipaySdk.pageExec('alipay.trade.page.pay', {
      bizContent: {
        out_trade_no: orderId,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: amount.toString(),
        subject: subject,
        // 支付成功后的同步跳转地址
        return_url: process.env.ALIPAY_RETURN_URL || 'http://localhost:3000/workspace/pricing',
      },
    });

    return NextResponse.json({
      success: true,
      payHtml: result,
    });
  } catch (error) {
    console.error('支付宝支付创建失败:', error);
    return NextResponse.json({ error: '支付创建失败' }, { status: 500 });
  }
}