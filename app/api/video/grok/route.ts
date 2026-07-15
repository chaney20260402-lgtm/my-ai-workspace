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
    console.log('🔵 Grok API 调用开始');

    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      console.log('❌ 未登录');
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.log(`✅ 用户: ${session.user.phone}`);

    const body = await request.json();
    const { prompt, imageUrl, model = 'grok-imagine-video', duration = 5, aspectRatio = '16:9' } = body;
    console.log(`📥 请求参数: model=${model}, duration=${duration}, aspectRatio=${aspectRatio}`);

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    const userPhone = session.user.phone;
    const costPerSecond = GROK_MODELS[model as keyof typeof GROK_MODELS]?.costPerSecond || 0.08;
    const totalCost = Math.ceil(duration * costPerSecond);
    console.log(`💰 需要积分: ${totalCost}`);

    // 检查积分
    try {
      const hasEnough = await checkUserCredits(userPhone, totalCost);
      if (!hasEnough) {
        console.log(`❌ 积分不足: 需要 ${totalCost}`);
        return NextResponse.json({ error: `积分不足，需要 ${totalCost} 积分` }, { status: 402 });
      }
    } catch (creditError) {
      console.error('❌ 积分检查异常:', creditError);
      return NextResponse.json({ error: '积分系统异常' }, { status: 500 });
    }

    const XAI_API_KEY = process.env.XAI_API_KEY;
    if (!XAI_API_KEY) {
      console.error('❌ XAI_API_KEY 未设置');
      return NextResponse.json({ error: '服务器配置错误: XAI_API_KEY 未设置' }, { status: 500 });
    }
    console.log(`🔑 XAI_API_KEY 已设置 (长度: ${XAI_API_KEY.length})`);

    // 构建请求体
    const payload: any = {
      model: model,
      prompt: prompt,
    };
    if (duration) payload.duration = duration;
    if (aspectRatio) payload.aspect_ratio = aspectRatio;
    if (imageUrl) payload.image_url = imageUrl;

    console.log('📤 发送到 xAI 的请求:', JSON.stringify(payload, null, 2));

    // 调用 xAI API，设置超时 30 秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch('https://api.x.ai/v1/videos/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('❌ fetch 请求失败:', fetchError);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: '请求超时，请稍后重试' }, { status: 504 });
      }
      return NextResponse.json({ error: `网络请求失败: ${fetchError.message}` }, { status: 500 });
    }

    const data = await response.json();
    console.log('📥 xAI 响应状态:', response.status);
    console.log('📥 xAI 响应数据:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ xAI API 错误:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Grok 视频生成任务提交失败' },
        { status: response.status }
      );
    }

    // 扣除积分
    try {
      await checkAndDeductCredits(userPhone, totalCost, `Grok 视频生成 (${model})`);
      console.log(`✅ 积分扣除成功: ${totalCost}`);
    } catch (deductError) {
      console.error('❌ 积分扣除失败:', deductError);
      // 虽然任务已提交，但积分扣失败，仍然返回错误
      return NextResponse.json({ error: '积分扣除失败，请重试' }, { status: 402 });
    }

    return NextResponse.json({
      success: true,
      generationId: data.request_id,
      provider: 'grok',
    });

  } catch (error: any) {
    console.error('❌ 全局错误:', error);
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}