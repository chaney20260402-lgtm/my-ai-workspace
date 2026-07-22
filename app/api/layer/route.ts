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

    // 下载用户图片
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error('下载用户图片失败');
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
      throw new Error(data.error || '文本提取失败');
    }

    console.log(`📥 获取到背景图 URL: ${data.base_image_url}`);
    console.log(`📝 提取到 ${data.text_blocks?.length || 0} 个文本块`);

    // ============================================================
    // ✅ 代理下载背景图，转为 Base64 Data URL（避免 CORS）
    // ============================================================
    let baseImageDataUrl: string | null = null;
    try {
      const bgRes = await fetch(data.base_image_url);
      if (bgRes.ok) {
        const bgBuffer = await bgRes.arrayBuffer();
        const base64 = Buffer.from(bgBuffer).toString('base64');
        // 从响应头获取 MIME 类型（默认为 png）
        const contentType = bgRes.headers.get('content-type') || 'image/png';
        baseImageDataUrl = `data:${contentType};base64,${base64}`;
        console.log(`✅ 背景图已转换为 Data URL (长度: ${baseImageDataUrl.length})`);
      } else {
        console.warn('⚠️ 下载背景图失败，状态:', bgRes.status);
      }
    } catch (bgError) {
      console.error('❌ 下载背景图异常:', bgError);
      // 不抛出，允许降级
    }

    // 如果转换失败，仍返回原始 URL（但前端可能因 CORS 无法使用）
    return NextResponse.json({
      success: true,
      baseImage: baseImageDataUrl || data.base_image_url, // 优先返回 Data URL
      textBlocks: data.text_blocks || [],
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