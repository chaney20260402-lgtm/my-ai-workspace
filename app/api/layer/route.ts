// app/api/layer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deductCredits } from '@/lib/credits';

const CREDITS_PER_LAYER = 8;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const userPhone = session.user.phone;

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: '缺少图片URL' }, { status: 400 });
    }

    // 积分扣除
    let newCredits: number;
    try {
      newCredits = await deductCredits(userPhone, CREDITS_PER_LAYER, '拆解图层', 'consume');
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || '积分不足，无法拆解图层' },
        { status: 402 }
      );
    }
    console.log(`💰 当前剩余积分: ${newCredits}`);

    // 调用 Ideogram 官方 API
    const ideogramApiKey = process.env.IDEOGRAM_API_KEY;
    if (!ideogramApiKey) {
      throw new Error('IDEOGRAM_API_KEY 未配置');
    }

    // 下载图片为 Buffer
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error('下载图片失败');
    const imageBuffer = await imageRes.arrayBuffer();

    // 构建 FormData
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', blob, 'image.png');
    formData.append('prompt', 'Extract text layers');

    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/layerize-text', {
      method: 'POST',
      headers: {
        'Api-Key': ideogramApiKey,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Ideogram API 错误:', data);
      // 透传 Ideogram 错误信息
      throw new Error(data.error || data.message || '文本提取失败');
    }

    console.log(`📥 获取到背景图: ${data.base_image_url}`);
    const textBlocks = data.text_blocks || []; // 确保是数组
    console.log(`📝 提取到 ${textBlocks.length} 个文本块`);

    return NextResponse.json({
      success: true,
      baseImage: data.base_image_url,
      textBlocks: data.text_blocks || [],  // 明确为 textBlocks
      credits: newCredits,
    });
  } catch (error: any) {
    console.error('❌ 拆图失败:', error);
    return NextResponse.json(
      { error: error.message || '拆图处理失败' },
      { status: 500 }
    );
  }
}