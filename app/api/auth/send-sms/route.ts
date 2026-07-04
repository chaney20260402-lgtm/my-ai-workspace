// app/api/send-sms/route.ts
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

export async function POST(request: Request) {
  console.log('✅ send-sms API 被调用了');
  try {
    const { phone } = await request.json();
    console.log('📱 收到手机号:', phone);

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: '手机号格式错误' },
        { status: 400 }
      );
    }

    // 生成 6 位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📱 验证码 (${phone}): ${code}`);

    // ✅ 存入 Redis，有效期 5 分钟（300 秒）
    const redis = getRedis();
    await redis.setex(`sms:${phone}`, 300, code);

    // TODO: 调用阿里云短信 API 发送短信
    // await sendSms(phone, code);

    // 模拟发送成功
    return NextResponse.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    console.error('❌ 错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}