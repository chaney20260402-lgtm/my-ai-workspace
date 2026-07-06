// app/api/send-sms/route.ts
import { NextResponse } from 'next/server';
import SMSClient from '@alicloud/sms-sdk';
import { getRedis } from '@/lib/redis';

const smsClient = new SMSClient({
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
  secretAccessKey: process.env.ALIYUN_ACCESS_KEY_SECRET!,
});

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

    // ✅ 1. 存入 Redis
    const redis = getRedis();
    await redis.setex(`sms:${phone}`, 300, code);
    console.log(`📤 验证码存入 Redis: key=sms:${phone}, code=${code}`);

    // ✅ 2. 调用阿里云短信 API
    const result = await smsClient.sendSMS({
      PhoneNumbers: phone,
      SignName: '深圳市阿瓜拉科技',
      TemplateCode: 'SMS_508420079',
      TemplateParam: JSON.stringify({ code }),
    });

    if (result.Code === 'OK') {
      return NextResponse.json({ success: true, message: '验证码已发送' });
    } else {
      // 发送失败，删除 Redis 中的验证码
      await redis.del(`sms:${phone}`);
      throw new Error(result.Message);
    }
  } catch (error) {
    console.error('发送失败:', error);
    return NextResponse.json(
      { success: false, message: '发送失败，请重试' },
      { status: 500 }
    );
  }
}