// app/api/video/status/route.ts
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

    const APIYI_KEY = process.env.APIYI_KEY;
    if (!APIYI_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    const response = await fetch(`https://api.apiyi.com/v1/video/generations/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${APIYI_KEY}`,
      },
    });

    const data = await response.json();

    // 🔍 打印完整响应，确认字段名
    console.log('📥 API 易原始响应:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || '查询状态失败' },
        { status: response.status }
      );
    }

    // ✅ 按照 API 易文档的标准字段提取
    // 客服说"彼时接口里输出的"，说明标准字段是 video_url
    const status = data.status || 'processing';
    const videoUrl = data.video_url || data.url || null;
    const progress = data.progress || 0;
    const error = data.error || null;

    console.log(`📊 状态: ${status}, 进度: ${progress}%, 视频URL: ${videoUrl || '暂无'}`);

    return NextResponse.json({
      success: true,
      status: status,
      videoUrl: videoUrl,
      progress: progress,
      error: error,
    });
  } catch (error: any) {
    console.error('查询视频状态失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}