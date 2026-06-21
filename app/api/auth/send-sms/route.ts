import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('✅ send-sms API 被调用了'); // 调试日志
  try {
    const { phone } = await request.json();
    console.log('📱 收到手机号:', phone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📱 验证码 (${phone}): ${code}`);
    return NextResponse.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    console.error('❌ 错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}