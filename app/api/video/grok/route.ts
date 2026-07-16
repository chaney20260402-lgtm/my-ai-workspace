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

    // ============================================================
    // ✅ 新增：检查 Grok Imagine 1.5 是否需要图片
    // ============================================================
    const isGrok15 = model === 'grok-imagine-video-1.5';

    // 如果是 1.5 版本且没有图片，返回错误
    if (isGrok15 && !imageUrl) {
      return NextResponse.json(
        { 
          error: 'Grok Imagine 1.5 需要提供参考图片，请上传图片并连接图片节点',
          model: model,
        },
        { status: 400 }
      );
    }

    // ✅ 通用图片检查（如果是其他 Grok 模型）
    if (!isGrok15 && model.startsWith('grok') && !imageUrl) {
      // 对于 grok-imagine-video 纯文本模型，允许没有图片
      // 这里可以只加警告，不强制报错
      console.log('⚠️ Grok 纯文本模式，无图片');
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
    };
    // 如果有图片，添加 image_url
    if (imageUrl) {
      payload.image_url = imageUrl;
    }
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

    console.log('📥 xAI 响应状态:', response.status);
    console.log('📥 xAI 响应数据:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ xAI API 错误详情:', {
        status: response.status,
        data: data,
        model: model,
        imageUrl: imageUrl,
      });
      return NextResponse.json(
        { 
          error: data.error?.message || 'Grok 视频生成任务提交失败',
          details: data,
          model: model,
        },
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