import { NextResponse } from 'next/server';
import SMSClient from '@alicloud/sms-sdk';
import { codeStore } from '@/lib/store';   // ✅ 保留导入

const smsClient = new SMSClient({
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
  secretAccessKey: process.env.ALIYUN_ACCESS_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ success: false, message: '手机号格式错误' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codeStore[phone] = { code, expires: Date.now() + 5 * 60 * 1000 };

    const result = await smsClient.sendSMS({
      PhoneNumbers: phone,
      SignName: process.env.ALIYUN_SMS_SIGN!,
      TemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE!,
      TemplateParam: JSON.stringify({ code }),
    });

    if (result.Code === 'OK') {
      return NextResponse.json({ success: true, message: '验证码已发送' });
    } else {
      throw new Error(result.Message);
    }
  } catch (error) {
    console.error('发送失败:', error);
    return NextResponse.json({ success: false, message: '发送失败' }, { status: 500 });
  }
}