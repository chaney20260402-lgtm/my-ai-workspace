import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { deductCredits } from '@/lib/credits';
import { calculateVideoCredits } from '@/lib/video-credits';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    // ✅ 添加 referenceVideoUrl
    const { 
      prompt, 
      imageUrl, 
      model = 'kling-turbo', 
      duration = 5, 
      aspectRatio = '16:9', 
      resolution = '720p',
      referenceVideoUrl 
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    const userPhone = session.user.phone;

    // 计算所需积分（参考视频不额外计费）
    const imageCount = imageUrl ? 1 : 0;
    const requiredCredits = calculateVideoCredits(model, resolution, duration, imageCount);
    if (requiredCredits === 0) {
      return NextResponse.json({ error: '不支持的模型或分辨率' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { phone: userPhone },
      select: { credits: true },
    });
    if (!user || user.credits < requiredCredits) {
      return NextResponse.json({ error: `积分不足，需要 ${requiredCredits} 积分` }, { status: 402 });
    }

    const KLING_API_KEY = process.env.KLING_API_KEY;
    if (!KLING_API_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // ✅ 可选的模型名称映射（如果可灵 API 需要）
    // const MODEL_NAME_MAP: Record<string, string> = { ... };
    // const apiModel = MODEL_NAME_MAP[model] || model;

    const payload: any = {
      model, // 或 apiModel
      prompt,
      duration,
      aspect_ratio: aspectRatio,
      resolution,
    };
    if (imageUrl) payload.image_url = imageUrl;
    // ✅ 添加参考视频
    if (referenceVideoUrl) {
      payload.video_url = referenceVideoUrl;
    }

    const response = await fetch('https://api.klingai.com/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KLING_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('可灵 API 错误:', data);
      return NextResponse.json(
        { error: data.error?.message || '可灵视频生成失败' },
        { status: response.status }
      );
    }

    const newCredits = await deductCredits(userPhone, requiredCredits, `可灵视频生成 (${duration}s)`, 'generate');

    return NextResponse.json({
      success: true,
      generationId: data.data?.task_id || data.id,
      requiredCredits,
      credits: newCredits,
    });
  } catch (error: any) {
    console.error('可灵视频生成失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}