// app/api/payment/alipay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRedis } from '@/lib/redis';
import { createRequire } from 'module';

export async function POST(request: NextRequest) {
  try {
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

    // ========== 🧪 模拟支付模式 ==========
    if (process.env.MOCK_PAYMENT === 'true') {
      console.log('⚠️ 模拟支付模式已启用，跳过真实支付宝调用');
      const { addCredits } = await import('@/lib/credits');
      await addCredits(userId, credits, `模拟支付: ${subject}`);
      await redis.setex(`order_processed:${orderId}`, 86400, '1');
      console.log(`✅ 模拟支付成功，用户 ${userId} 获得 ${credits} 积分`);
      return NextResponse.json({
        success: true,
        payUrl: process.env.ALIPAY_RETURN_URL || 'https://www.aguala.cn/workspace/pricing?payment=success',
        mock: true,
      });
    }

    // ========== 读取环境变量（每次重新读取，不缓存） ==========
    const appId = process.env.ALIPAY_APP_ID;
    const gateway = process.env.ALIPAY_GATEWAY;
    const privateKeyRaw = process.env.ALIPAY_PRIVATE_KEY;
    const publicKeyRaw = process.env.ALIPAY_PUBLIC_KEY;

    console.log('🔍 环境变量检查:');
    console.log('  APP_ID:', appId ? '已设置' : '未设置');
    console.log('  GATEWAY:', gateway ? '已设置' : '未设置');
    console.log('  PRIVATE_KEY:', privateKeyRaw ? `已设置（长度 ${privateKeyRaw.length}）` : '未设置');
    console.log('  PUBLIC_KEY:', publicKeyRaw ? `已设置（长度 ${publicKeyRaw.length}）` : '未设置');

    if (!appId || !gateway || !privateKeyRaw || !publicKeyRaw) {
      console.error('❌ 环境变量缺失！');
      return NextResponse.json({ error: '服务器配置错误：环境变量缺失' }, { status: 500 });
    }

    // 处理可能的转义换行符
    const privateKey = privateKeyRaw.includes('\\n') ? privateKeyRaw.replace(/\\n/g, '\n') : privateKeyRaw;
    const publicKey = publicKeyRaw.includes('\\n') ? publicKeyRaw.replace(/\\n/g, '\n') : publicKeyRaw;

    console.log('🔑 私钥格式:', {
      hasBegin: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasEnd: privateKey.includes('-----END PRIVATE KEY-----'),
      preview: privateKey.substring(0, 50) + '...'
    });
    console.log('🔑 公钥格式:', {
      hasBegin: publicKey.includes('-----BEGIN PUBLIC KEY-----'),
      hasEnd: publicKey.includes('-----END PUBLIC KEY-----'),
      preview: publicKey.substring(0, 50) + '...'
    });

    // ========== 动态导入 alipay-sdk ==========
    const require = createRequire(import.meta.url);
    const { AlipaySdk } = require('alipay-sdk');

    const alipaySdk = new AlipaySdk({
      appId: appId,
      gateway: gateway,
      privateKey: privateKey,
      alipayPublicKey: publicKey,
      timeout: 30000,
    });

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
      {
        error: error.message || '支付创建失败',
        detail: error.responseDataRaw || '无详细信息'
      },
      { status: 500 }
    );
  }
}