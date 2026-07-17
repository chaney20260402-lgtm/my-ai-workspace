// app/api/video/grok/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkAndDeductCredits, calculateVideoCredits, getCredits } from '@/lib/credits';
import { getRedis } from '@/lib/redis';

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

    // 查询 Grok 视频状态
    const response = await fetch(`https://api.x.ai/v1/videos/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
    });

    const data = await response.json();

    console.log('📥 Grok 状态响应:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || '查询状态失败' },
        { status: response.status }
      );
    }

    const status = data.status || 'processing';
    const videoUrl = data.video?.url || null;
    const progress = data.progress || 0;

    // ============================================================
    // ✅ 如果任务完成且有视频 URL，扣除积分（仅一次）
    // ============================================================
    let credits = null;
    let deductError = null;

    if (status === 'done' && videoUrl) {
      const userPhone = session.user.phone;
      const redis = getRedis();
      const paidKey = `video:paid:${generationId}`;

      // 检查是否已扣过积分
      const alreadyPaid = await redis.get(paidKey);
      if (!alreadyPaid) {
        try {
          // 从 Redis 读取提交时存储的参数
          const paramsKey = `video:params:${generationId}`;
          const paramsStr = await redis.get(paramsKey);
          let params = { model: 'grok-imagine-video', resolution: '720p', duration: 5, imageCount: 0 };
          if (paramsStr) {
            params = JSON.parse(paramsStr);
          }

          // 计算所需积分
          const requiredCredits = calculateVideoCredits(params.model, params.resolution, params.duration, params.imageCount);
          if (requiredCredits > 0) {
            // 扣除积分
            const newCredits = await checkAndDeductCredits(userPhone, requiredCredits, `Grok 视频生成 (${params.model})`);
            credits = newCredits;
            // 标记已扣，24小时过期
            await redis.set(paidKey, '1', 'EX', 86400);
            console.log(`✅ 扣除积分 ${requiredCredits}，剩余 ${newCredits}`);
          }
        } catch (error: any) {
          console.error('❌ 积分扣除失败:', error);
          deductError = error.message;
        }
      } else {
        // 已扣过积分，获取当前积分
        credits = await getCredits(userPhone);
      }
    }

    return NextResponse.json({
      success: true,
      status: status,
      videoUrl: videoUrl,
      progress: progress,
      credits: credits,
      error: deductError,
    });
  } catch (error: any) {
    console.error('查询 Grok 视频状态失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}