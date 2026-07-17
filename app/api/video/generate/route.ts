import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkUserCredits, checkAndDeductCredits } from '@/lib/credits';

// ============================================================
// ✅ 模型配置表（添加新模型）
// ============================================================
const MODEL_CONFIGS: Record<string, { cost: number; modelName: string; maxDuration: number }> = {
  // Veo 3.1 系列
  'veo-3.1-generate-preview': { cost: 30, modelName: 'veo-3.1-generate-preview', maxDuration: 8 },
  'veo-3.1-fast-generate-preview': { cost: 20, modelName: 'veo-3.1-fast-generate-preview', maxDuration: 8 },
  // ✅ Wan2.7 视频生成（新上线）
  'wan2.7': { cost: 35, modelName: 'wan2.7', maxDuration: 12 },
  // ✅ VEO 3.1 官转（热卖）
  'veo-3.1-official': { cost: 40, modelName: 'veo-3.1-official', maxDuration: 8 },
  // ✅ HappyHorse 1.0（新上线）
  'happyhorse-1.0': { cost: 35, modelName: 'happyhorse-1.0', maxDuration: 12 },
  // ✅ Wan2.6
  'wan2.6': { cost: 30, modelName: 'wan2.6', maxDuration: 12 },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, imageUrl, model = 'veo-3.1-generate-preview', duration = 5, aspectRatio = '16:9' } = body;

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    // ============================================================
    // ✅ 从配置表中获取模型信息
    // ============================================================
    const config = MODEL_CONFIGS[model];
    if (!config) {
      return NextResponse.json({ error: `不支持的模型: ${model}` }, { status: 400 });
    }

    const userPhone = session.user.phone;

    // ✅ 使用配置中的积分成本
    const cost = config.cost;
    const hasEnough = await checkUserCredits(userPhone, cost);
    if (!hasEnough) {
      return NextResponse.json({ error: `积分不足，需要 ${cost} 积分` }, { status: 402 });
    }

    const APIYI_KEY = process.env.APIYI_KEY;
    if (!APIYI_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // ============================================================
    // ✅ 构建请求体（支持不同的模型）
    // ============================================================
    const payload: any = {
      model: config.modelName,
      prompt: prompt,
      aspect_ratio: aspectRatio || '16:9',
      duration: String(duration || 5),
    };

    // 如果有图片，添加 image_url
    if (imageUrl) {
      payload.image_url = imageUrl;
    }

    console.log('📤 视频生成请求:', JSON.stringify(payload, null, 2));

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
      console.error('❌ API 易错误:', data);
      return NextResponse.json(
        { error: data.error?.message || '视频生成任务提交失败' },
        { status: response.status }
      );
    }

    // 扣除积分
    await checkAndDeductCredits(userPhone, cost, `视频生成 (${model})`);

    return NextResponse.json({
      success: true,
      generationId: data.id,
    });
  } catch (error: any) {
    console.error('提交视频生成任务失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}