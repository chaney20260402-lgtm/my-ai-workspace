import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deductCredits } from '@/lib/credits';
import { createCanvas, loadImage } from 'canvas';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    console.log('📤 调用 ideogram-ai/layerize 模型...');
    const input = {
      flat_graphic_image: imageUrl,
      prompt: 'Extract text layers',
      seed: Math.floor(Math.random() * 1000000),
    };

    // 类型断言：输出为数组
    const output = (await replicate.run('ideogram-ai/layerize', { input })) as any[];

    if (!Array.isArray(output) || output.length < 2) {
      throw new Error('模型返回格式异常');
    }

    const baseImageObj = output[0];
    const textBlocks = output[1] || [];

    const baseImageUrl = typeof baseImageObj?.url === 'function'
      ? baseImageObj.url()
      : baseImageObj?.url;

    if (!baseImageUrl) {
      throw new Error('未能获取背景图 URL');
    }

    console.log(`📥 获取到背景图: ${baseImageUrl}`);
    console.log(`📝 提取到 ${textBlocks.length} 个文本块`);

    const baseRes = await fetch(baseImageUrl);
    if (!baseRes.ok) throw new Error('下载背景图失败');
    const baseArrayBuffer = await baseRes.arrayBuffer();
    const baseBuffer = Buffer.from(baseArrayBuffer);

    const baseImage = await loadImage(baseBuffer);
    const imgWidth = baseImage.width;
    const imgHeight = baseImage.height;

    const layers: { name: string; data: string; width: number; height: number; opacity: number }[] = [];

    // 背景图层
    layers.push({
      name: '背景',
      data: baseBuffer.toString('base64'),
      width: imgWidth,
      height: imgHeight,
      opacity: 1,
    });

    // 文本图层
    for (let i = 0; i < textBlocks.length; i++) {
      const block = textBlocks[i];
      if (!block.bbox) {
        console.warn(`文本块 ${i} 缺少 bbox 信息，跳过`);
        continue;
      }

      const { x, y, width, height } = block.bbox;
      const canvas = createCanvas(imgWidth, imgHeight);
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, imgWidth, imgHeight);

      // 估算字号
      const fontSize = Math.min(width, height) * 0.8;
      ctx.font = `${fontSize}px "${block.font_name || 'Arial'}"`;
      ctx.fillStyle = block.color || '#000000';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      // 处理文本换行（简单处理）
      const words = block.text?.split(' ') || [];
      let line = '';
      let yOffset = 0;
      const lineHeight = fontSize * 1.2;
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width && line.length > 0) {
          ctx.fillText(line, x, y + yOffset);
          line = word + ' ';
          yOffset += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ctx.fillText(line, x, y + yOffset);
      }

      const pngBuffer = canvas.toBuffer('image/png');
      layers.push({
        name: `文本_${i + 1}`,
        data: pngBuffer.toString('base64'),
        width: imgWidth,
        height: imgHeight,
        opacity: 1,
      });
    }

    console.log(`✅ 成功生成 ${layers.length} 个图层（含背景）`);

    return NextResponse.json({
      success: true,
      layers,
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