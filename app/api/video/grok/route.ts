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

    // ============================================================
    // ✅ 打印接收到的完整 body
    // ============================================================
    console.log('📥 Grok API 接收到完整 body:', JSON.stringify(body, null, 2));
    console.log('📥 提取的 imageUrl:', imageUrl);
    console.log('📥 imageUrl 类型:', typeof imageUrl);
    console.log('📥 imageUrl 是否为空字符串:', imageUrl === '');
    console.log('📥 imageUrl 是否为 undefined:', imageUrl === undefined);

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    const isGrok15 = model === 'grok-imagine-video-1.5';

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
    // ✅ 构建请求体 - 根据模型类型决定是否需要 image_url
    // ============================================================
    const payload: any = {
      model: model,
      prompt: prompt,
    };

    // ✅ 对于 1.5 版本，直接添加 image_url
    if (isGrok15) {
      payload.image_url = imageUrl;
      console.log('🟣 1.5 版本，添加 image_url:', imageUrl);
    } else {
      // 对于普通版本，如果有图片才添加
      if (imageUrl && imageUrl.trim() !== '') {
        payload.image_url = imageUrl;
        console.log('✅ 已添加 image_url 到 payload:', imageUrl);
      } else {
        console.log('⚠️ 没有 image_url，纯文本模式');
      }
    }

    if (duration) payload.duration = duration;
    if (aspectRatio) payload.aspect_ratio = aspectRatio;

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