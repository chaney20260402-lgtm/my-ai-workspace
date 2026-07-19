import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const MODEL_CONFIGS: Record<string, { cost: number; modelName: string; maxDuration: number }> = {
  'veo-3.1-generate-preview': { cost: 30, modelName: 'veo-3.1-generate-preview', maxDuration: 8 },
  'veo-3.1-fast-generate-preview': { cost: 20, modelName: 'veo-3.1-fast-generate-preview', maxDuration: 8 },
  'wan2.7': { cost: 35, modelName: 'wan2.7', maxDuration: 12 },
  'veo-3.1-official': { cost: 40, modelName: 'veo-3.1-official', maxDuration: 8 },
  'happyhorse-1.0': { cost: 35, modelName: 'happyhorse-1.0', maxDuration: 12 },
  'wan2.6': { cost: 30, modelName: 'wan2.6', maxDuration: 12 },
};

export async function POST(request: Request) {
  console.log('🔵 进入 /api/video/generate');
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

    const config = MODEL_CONFIGS[model];
    if (!config) {
      return NextResponse.json({ error: `不支持的模型: ${model}` }, { status: 400 });
    }

    const userPhone = session.user.phone;
    const cost = config.cost;

    // 1. 查询当前积分
    const user = await prisma.user.findUnique({
      where: { phone: userPhone },
      select: { credits: true },
    });
    console.log(`📝 用户 ${userPhone} 当前积分: ${user?.credits}`);

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    if (user.credits < cost) {
      return NextResponse.json(
        { error: `积分不足，需要 ${cost} 积分，当前 ${user.credits} 积分` },
        { status: 402 }
      );
    }

    const APIYI_KEY = process.env.APIYI_KEY;
    if (!APIYI_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // 构造请求体
    const payload: any = {
      model: config.modelName,
      prompt: prompt,
      aspect_ratio: aspectRatio || '16:9',
      duration: String(duration || 5),
    };
    if (imageUrl) payload.image_url = imageUrl;

    console.log('📤 调用 API 易:', JSON.stringify(payload, null, 2));

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

    console.log('✅ API 易成功，generationId:', data.id);

    // 2. 扣除积分（事务）
    console.log(`💰 开始扣除积分: ${cost}`);
    let newCredits: number;
    try {
      const updatedUser = await prisma.$transaction(async (tx) => {
        const current = await tx.user.findUnique({
          where: { phone: userPhone },
          select: { credits: true },
        });
        if (!current || current.credits < cost) {
          throw new Error('积分不足（并发）');
        }

        const updated = await tx.user.update({
          where: { phone: userPhone },
          data: { credits: { decrement: cost } },
          select: { credits: true },
        });

        await tx.creditTransaction.create({
          data: {
            userPhone: userPhone,
            amount: -cost,
            type: 'generate',
            description: `视频生成 (${model})`,
          },
        });

        return updated;
      });
      newCredits = updatedUser.credits;
      console.log(`✅ 积分扣除成功，剩余: ${newCredits}`);
    } catch (txError: any) {
      console.error('❌ 事务失败:', txError.message);
      // 如果积分扣减失败，但视频已提交，仍返回成功，但标记积分扣除失败？（需要决策，这里我们返回错误）
      return NextResponse.json(
        { error: '积分扣减失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 返回新积分
    return NextResponse.json({
      success: true,
      generationId: data.id,
      newCredits: newCredits, // 关键：返回最新积分
    });
  } catch (error: any) {
    console.error('❌ 提交视频生成任务失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}