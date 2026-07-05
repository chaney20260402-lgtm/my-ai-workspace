import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { phone, newPassword, code } = await req.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: '手机号格式错误' }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: '请输入验证码' }, { status: 400 });
    }

    const redis = getRedis();

    // 验证手机号验证码
    const storedCode = await redis.get(`sms:${phone}`);
    if (!storedCode || storedCode !== code) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    // 检查用户是否存在
    const userData = await redis.get(`user:${phone}`);
    if (!userData) {
      return NextResponse.json({ error: '该手机号未注册' }, { status: 400 });
    }

    // 更新密码
    const user = JSON.parse(userData);
    user.password = await bcrypt.hash(newPassword, 10);
    await redis.set(`user:${phone}`, JSON.stringify(user));

    // 删除已使用的验证码
    await redis.del(`sms:${phone}`);

    return NextResponse.json({ success: true, message: '密码重置成功，请登录' });
  } catch (error) {
    console.error('重置密码失败:', error);
    return NextResponse.json({ error: '重置失败，请重试' }, { status: 500 });
  }
}