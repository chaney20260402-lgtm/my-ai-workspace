// app/api/send-sms/route.ts
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: '手机号格式错误' },
        { status: 400 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ 存入 Redis
    const redis = getRedis();
    await redis.setex(`sms:${phone}`, 300, code);
    console.log(`📤 验证码存入 Redis: key=sms:${phone}, code=${code}`);

    // TODO: 调用阿里云短信 API
    // const result = await smsClient.sendSMS({...});

    return NextResponse.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    console.error('发送失败:', error);
    return NextResponse.json(
      { success: false, message: '发送失败' },
      { status: 500 }
    );
  }
}