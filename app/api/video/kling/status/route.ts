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

    const KLING_API_KEY = process.env.KLING_API_KEY;
    if (!KLING_API_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    const response = await fetch(`https://api.klingai.com/v1/videos/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${KLING_API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || '查询状态失败' },
        { status: response.status }
      );
    }

    // 根据可灵返回格式调整
    const statusMap: Record<string, string> = {
      'pending': 'processing',
      'processing': 'processing',
      'succeeded': 'completed',
      'failed': 'failed',
    };
    const status = statusMap[data.data?.status] || 'processing';
    const videoUrl = data.data?.video_url || null;

    return NextResponse.json({
      success: true,
      status,
      videoUrl,
      progress: data.data?.progress || 0,
    });
  } catch (error: any) {
    console.error('查询可灵状态失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}