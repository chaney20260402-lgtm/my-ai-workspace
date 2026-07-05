import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { phone, password, code } = await req.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: '手机号格式错误' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: '请输入验证码' }, { status: 400 });
    }

    const redis = getRedis();

    // 验证手机号验证码（与登录验证码使用同一个key）
    const storedCode = await redis.get(`sms:${phone}`);
    if (!storedCode || storedCode !== code) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    // 检查用户是否已存在
    const existing = await redis.get(`user:${phone}`);
    if (existing) {
      return NextResponse.json({ error: '该手机号已注册，请直接登录' }, { status: 400 });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 存储用户信息（手机号、密码、注册时间）
    await redis.set(`user:${phone}`, JSON.stringify({
      phone,
      password: hashedPassword,
      registeredAt: new Date().toISOString(),
    }));

    // 删除已使用的验证码
    await redis.del(`sms:${phone}`);

    return NextResponse.json({ success: true, message: '注册成功，请登录' });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}