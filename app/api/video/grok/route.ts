// app/api/video/grok/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkUserCredits, checkAndDeductCredits } from '@/lib/credits';

const GROK_MODELS = {
  'grok-imagine-video': { label: 'Grok Imagine', costPerSecond: 0.08 },
  'grok-imagine-video-1.5': { label: 'Grok Imagine 1.5', costPerSecond: 0.08 },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, imageUrl, model = 'grok-imagine-video', duration = 5, aspectRatio = '16:9' } = body;

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    // ✅ 检查 Grok 模型是否需要图片
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Grok 视频生成需要提供参考图片，请连接一个图片参考节点' },
        { status: 400 }
      );
    }

    const userPhone = session.user.phone;
    const costPerSecond = GROK_MODELS[model as keyof typeof GROK_MODELS]?.costPerSecond || 0.08;
    const totalCost = Math.ceil(duration * costPerSecond);

    const hasEnough = await checkUserCredits(userPhone, totalCost);
    if (!hasEnough) {
      return NextResponse.json({ error: `积分不足，需要 ${totalCost} 积分` }, { status: 402 });
    }

    const XAI_API_KEY = process.env.XAI_API_KEY;
    if (!XAI_API_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // ============================================================
    // ✅ 构建请求体 - 确保 image_url 被包含
    // ============================================================
    const payload: any = {
      model: model,
      prompt: prompt,
      image_url: imageUrl,  // ✅ 添加图片 URL
    };
    if (duration) payload.duration = duration;
    if (aspectRatio) payload.aspect_ratio = aspectRatio;

    console.log('📤 Grok 请求 Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.x.ai/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ xAI API 错误:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Grok 视频生成任务提交失败' },
        { status: response.status }
      );
    }

    await checkAndDeductCredits(userPhone, totalCost, `Grok 视频生成 (${model})`);

    return NextResponse.json({
      success: true,
      generationId: data.request_id,
      provider: 'grok',
    });
  } catch (error: any) {
    console.error('提交 Grok 视频生成任务失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}