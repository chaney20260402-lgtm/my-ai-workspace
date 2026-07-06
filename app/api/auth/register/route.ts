// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { phone, password, code } = await req.json();
    console.log('📥 注册请求:', { phone, code, password: '***' });

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      console.log('❌ 手机号格式错误');
      return NextResponse.json({ error: '手机号格式错误' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      console.log('❌ 密码长度不足');
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }
    if (!code) {
      console.log('❌ 缺少验证码');
      return NextResponse.json({ error: '请输入验证码' }, { status: 400 });
    }

    const redis = getRedis();
    const storedCode = await redis.get(`sms:${phone}`);
    console.log(`🔍 验证码: 输入=${code}, 存储=${storedCode}`);

    if (!storedCode || storedCode !== code) {
      console.log('❌ 验证码错误或已过期');
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    // 检查用户是否已存在
    const existing = await redis.get(`user:${phone}`);
    if (existing) {
      console.log('❌ 用户已存在');
      return NextResponse.json({ error: '该手机号已注册，请直接登录' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await redis.set(`user:${phone}`, JSON.stringify({
      phone,
      password: hashedPassword,
      registeredAt: new Date().toISOString(),
    }));
    await redis.del(`sms:${phone}`); // 删除已使用的验证码

    console.log('✅ 注册成功');
    return NextResponse.json({ success: true, message: '注册成功，请登录' });
  } catch (error) {
    console.error('❌ 注册失败:', error);
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}