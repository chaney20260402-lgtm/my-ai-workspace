// app/api/video/grok/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkUserCredits, calculateVideoCredits } from '@/lib/credits';
import { getRedis } from '@/lib/redis';

// ✅ 移除 grok-imagine-video-1.5，只保留存在的模型
const GROK_MODELS = {
  'grok-imagine-video': { label: 'Grok Imagine' },
  'grok-imagine-video-1.5-preview': { label: 'Grok Imagine 1.5 Preview' },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, imageUrl, model = 'grok-imagine-video', duration = 5, aspectRatio = '16:9', resolution = '720p' } = body;

    // ============================================================
    // ✅ 打印接收到的完整 body
    // ============================================================
    console.log('📥 Grok API 接收到完整 body:', JSON.stringify(body, null, 2));
    console.log('📥 提取的 imageUrl:', imageUrl);
    console.log('📥 提取的 resolution:', resolution);
    console.log('📥 提取的 duration:', duration);
    console.log('📥 提取的 model:', model);

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    // 检查模型是否存在
    if (!GROK_MODELS[model as keyof typeof GROK_MODELS]) {
      return NextResponse.json(
        { error: `不支持的模型: ${model}` },
        { status: 400 }
      );
    }

    const isGrok15 = model === 'grok-imagine-video-1.5-preview';

    // ============================================================
    // ✅ 1.5 版本强制需要图片
    // ============================================================
    if (isGrok15 && !imageUrl) {
      console.error('❌ 1.5 版本缺少图片');
      return NextResponse.json(
        { 
          error: 'Grok Imagine 1.5 需要提供参考图片，请上传图片并连接图片节点',
          model: model,
          receivedImageUrl: imageUrl,
        },
        { status: 400 }
      );
    }

    const userPhone = session.user.phone;

    // ============================================================
    // ✅ 计算所需积分（预检查，不扣除）
    // ============================================================
    const imageCount = imageUrl ? 1 : 0;
    const requiredCredits = calculateVideoCredits(model, resolution, duration, imageCount);

    if (requiredCredits === 0) {
      return NextResponse.json(
        { error: `不支持的模型或分辨率: ${model} / ${resolution}` },
        { status: 400 }
      );
    }

    // 检查积分是否充足（但不扣除）
    const hasEnough = await checkUserCredits(userPhone, requiredCredits);
    if (!hasEnough) {
      return NextResponse.json(
        { error: `积分不足，需要 ${requiredCredits} 积分` },
        { status: 402 }
      );
    }

    const XAI_API_KEY = process.env.XAI_API_KEY;
    if (!XAI_API_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // ============================================================
    // ✅ 构建请求体 - 根据模型类型决定是否需要 image
    // ============================================================
    const payload: any = {
      model: model,
      prompt: prompt,
      duration: duration,
      aspect_ratio: aspectRatio,
      resolution: resolution,
    };

    // ✅ 对于 1.5 版本，使用 image 结构（官方要求）
    if (isGrok15) {
      payload.image = { url: imageUrl };
      console.log('🟣 1.5 版本，添加 image:', payload.image);
      console.log('🟣 1.5 版本，分辨率:', resolution);
    } else {
      // 对于普通版本，如果有图片才添加
      if (imageUrl && imageUrl.trim() !== '') {
        payload.image = { url: imageUrl };
        console.log('✅ 已添加 image 到 payload:', payload.image);
      } else {
        console.log('⚠️ 没有 image_url，纯文本模式');
      }
    }

    console.log('📤 Grok 最终 Payload:', JSON.stringify(payload, null, 2));

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
        payload: payload,
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

    // ============================================================
    // ✅ 返回 generationId，但不扣除积分（积分在轮询成功时扣除）
    // 同时存储参数到 Redis，用于轮询时计算积分
    // ============================================================
    const generationId = data.request_id;

    // 存储参数到 Redis，供轮询接口使用
    const redis = getRedis();
    const paramsKey = `video:params:${generationId}`;
    await redis.set(paramsKey, JSON.stringify({
      model,
      resolution,
      duration,
      imageCount,
      userPhone,
      requiredCredits,
    }), 'EX', 3600); // 1小时过期

    console.log('✅ 任务已提交，generationId:', generationId);
    console.log('💰 预计算所需积分:', requiredCredits);

    return NextResponse.json({
      success: true,
      generationId: generationId,
      requiredCredits: requiredCredits,
      provider: 'grok',
    });
  } catch (error: any) {
    console.error('提交 Grok 视频生成任务失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
