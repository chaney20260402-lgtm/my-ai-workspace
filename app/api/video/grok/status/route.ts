// app/api/video/grok/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserCredits, deductCredits } from '@/lib/credits'; // 改用新函数
import { getRedis } from '@/lib/redis';
import { calculateVideoCredits } from '@/lib/credits'; // 此函数如果是纯计算，保留

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('generationId');
    if (!generationId) {
      return NextResponse.json({ error: '缺少 generationId' }, { status: 400 });
    }

    const XAI_API_KEY = process.env.XAI_API_KEY;
    if (!XAI_API_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // 查询 Grok 状态
    const response = await fetch(`https://api.x.ai/v1/videos/${generationId}`, {
      headers: { 'Authorization': `Bearer ${XAI_API_KEY}` },
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || '查询状态失败' },
        { status: response.status }
      );
    }

    const status = data.status || 'processing';
    const videoUrl = data.video?.url || null;
    const progress = data.progress || 0;

    let credits: number | null = null;
    let deductError: string | null = null;
    const userPhone = session.user.phone;

    if (status === 'done' && videoUrl) {
      const redis = getRedis();
      const paidKey = `video:paid:${generationId}`;
      const alreadyPaid = await redis.get(paidKey);

      if (!alreadyPaid) {
        try {
          // 获取提交时存储的参数
          const paramsKey = `video:params:${generationId}`;
          const paramsStr = await redis.get(paramsKey);
          let params = { model: 'grok-imagine-video', resolution: '720p', duration: 5, imageCount: 0 };
          if (paramsStr) {
            params = JSON.parse(paramsStr);
          }

          const requiredCredits = calculateVideoCredits(params.model, params.resolution, params.duration, params.imageCount);
          if (requiredCredits > 0) {
            // ✅ 使用新函数扣除积分
            credits = await deductCredits(
              userPhone,
              requiredCredits,
              `Grok 视频生成 (${params.model})`,
              'generate'
            );
            await redis.set(paidKey, '1', 'EX', 86400);
            console.log(`✅ 扣除积分 ${requiredCredits}，剩余 ${credits}`);
          } else {
            credits = await getUserCredits(userPhone);
          }
        } catch (error: any) {
          console.error('❌ 积分扣除失败:', error);
          deductError = error.message;
          // 即使扣分失败，仍返回状态，但标记错误
          credits = await getUserCredits(userPhone); // 尝试获取当前积分
        }
      } else {
        // 已扣过，获取当前积分
        credits = await getUserCredits(userPhone);
      }
    } else {
      // 任务未完成，返回当前积分（可能用于显示）
      credits = await getUserCredits(userPhone);
    }

    return NextResponse.json({
      success: true,
      status,
      videoUrl,
      progress,
      credits,
      error: deductError,
    });
  } catch (error: any) {
    console.error('查询 Grok 视频状态失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}