import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkUserCredits, checkAndDeductCredits } from '@/lib/credits';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, imageUrl, model = 'veo-3.1-generate-preview' } = body;

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    const userPhone = session.user.phone;
    const cost = 30; // 视频生成消耗积分

    // 检查积分
    const hasEnough = await checkUserCredits(userPhone, cost);
    if (!hasEnough) {
      return NextResponse.json({ error: '积分不足，请充值' }, { status: 402 });
    }

    const APIYI_KEY = process.env.APIYI_KEY;
    if (!APIYI_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // 构建请求体
const payload: any = {
  model: model,
  prompt: prompt,
  aspect_ratio: body.aspectRatio || '16:9',
  duration: String(body.duration || 5),  // ✅ 转换为字符串
};
if (imageUrl) {
  payload.image_url = imageUrl;
}

    // 调用 API 易视频生成接口
    const response = await fetch('https://api.apiyi.com/v1/video/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIYI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API 易错误:', data);
      return NextResponse.json(
        { error: data.error?.message || '视频生成任务提交失败' },
        { status: response.status }
      );
    }

    // 扣除积分（提交成功后再扣）
    await checkAndDeductCredits(userPhone, cost, '视频生成');

    return NextResponse.json({
      success: true,
      generationId: data.id,
    });
  } catch (error: any) {
    console.error('提交视频生成任务失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}