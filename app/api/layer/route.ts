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

// 轮询等待预测完成
const waitForPrediction = async (prediction: any, maxAttempts = 60, interval = 3000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await replicate.predictions.get(prediction.id);
    console.log(`⏳ 轮询第 ${i+1} 次，状态: ${status.status}`);
    if (status.status === 'succeeded') {
      return status;
    }
    if (status.status === 'failed' || status.status === 'canceled') {
      throw new Error(`预测失败: ${status.error || '未知错误'}`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('预测超时，请稍后重试');
};

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

    // 1. 创建预测（不扣积分）
    console.log('📤 创建 ideogram-ai/layerize 预测...');
    const prediction = await replicate.predictions.create({
      version: "ideogram-ai/layerize",
      input: {
        flat_graphic_image: imageUrl,
        prompt: "Extract text layers",
        seed: Math.floor(Math.random() * 1000000),
      },
    });

    console.log(`📌 预测 ID: ${prediction.id}`);
    console.log(`🔗 状态查询: ${prediction.urls?.get}`);

    // 2. 轮询等待结果
    const result = await waitForPrediction(prediction);

    // 3. 解析输出
    const output = result.output;
    if (!output || !Array.isArray(output) || output.length < 2) {
      throw new Error('输出格式异常');
    }

    // 4. ✅ 成功获取结果，现在扣除积分
    let newCredits: number;
    try {
      newCredits = await deductCredits(userPhone, CREDITS_PER_LAYER, '拆解图层', 'consume');
    } catch (error: any) {
      console.error('❌ 积分扣除失败:', error.message);
      // 虽然模型成功，但积分扣减失败，仍需返回错误
      return NextResponse.json(
        { error: error.message || '积分不足，无法拆解图层' },
        { status: 402 }
      );
    }
    console.log(`💰 当前剩余积分: ${newCredits}`);

    // 5. 处理图层数据...
    // 获取背景图 URL（第一个元素）
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

    // 下载背景图作为 base 图层
    const baseRes = await fetch(baseImageUrl);
    if (!baseRes.ok) throw new Error('下载背景图失败');
    const baseArrayBuffer = await baseRes.arrayBuffer();
    const baseBuffer = Buffer.from(baseArrayBuffer);

    const baseImage = await loadImage(baseBuffer);
    const imgWidth = baseImage.width;
    const imgHeight = baseImage.height;

    const layers: { name: string; data: string; width: number; height: number; opacity: number }[] = [];

    layers.push({
      name: '背景',
      data: baseBuffer.toString('base64'),
      width: imgWidth,
      height: imgHeight,
      opacity: 1,
    });

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

      const fontSize = Math.min(width, height) * 0.8;
      ctx.font = `${fontSize}px "${block.font_name || 'Arial'}"`;
      ctx.fillStyle = block.color || '#000000';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      ctx.fillText(block.text || '', x, y, width);

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
    // 如果预测失败或超时，不扣除积分（积分已在前面扣除，但若异常发生在扣积分之前，则不会扣）
    // 如果扣积分后出现异常，可能导致积分已扣但结果未返回，这是一个需要权衡的点。
    // 这里假设扣积分后很少出错，如果出错，记录日志并返回错误。
    return NextResponse.json(
      { error: error.message || '拆图处理失败' },
      { status: 500 }
    );
  }
}