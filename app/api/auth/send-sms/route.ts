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
    console.log(`🔍 Redis 连接状态:`, redis ? '已连接' : '未连接');
    
    await redis.setex(`sms:${phone}`, 300, code);
    console.log(`📤 验证码存入 Redis: key=sms:${phone}, code=${code}`);

    // 验证是否真的存进去了
    const verify = await redis.get(`sms:${phone}`);
    console.log(`✅ 验证读取: key=sms:${phone}, value=${verify}`);

    return NextResponse.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    console.error('发送失败:', error);
    return NextResponse.json(
      { success: false, message: '发送失败' },
      { status: 500 }
    );
  }
}