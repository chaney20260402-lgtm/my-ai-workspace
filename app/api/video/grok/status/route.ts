// app/api/video/grok/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

    // Grok 返回 status: 'done' 表示完成
    const status = data.status || 'processing';
    const videoUrl = data.video?.url || null;

    return NextResponse.json({
      success: true,
      status: status,
      videoUrl: videoUrl,
      progress: data.progress || 0,
      error: data.error,
    });
  } catch (error: any) {
    console.error('查询 Grok 视频状态失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}