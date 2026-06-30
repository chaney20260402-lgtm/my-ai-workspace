import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkAndDeductCredits } from '@/lib/credits';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// 每次拆解图层消耗的积分数（可调整）
const CREDITS_PER_LAYER = 8;

export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录，请先登录' }, { status: 401 });
    }
    const userPhone = session.user.phone;

    // 2. 解析请求体
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: '缺少图片URL' }, { status: 400 });
    }

    // 3. 积分扣除（开发环境跳过）
    let newCredits: number;
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`⚠️ 开发模式：跳过实际积分扣除，假装消耗 ${CREDITS_PER_LAYER} 积分`);
      // 模拟剩余积分（假设原有100分）
      newCredits = 100 - CREDITS_PER_LAYER;
    } else {
      try {
        newCredits = await checkAndDeductCredits(userPhone, CREDITS_PER_LAYER, '拆解图层');
      } catch (error: any) {
        console.error('❌ 积分扣除失败:', error.message);
        return NextResponse.json(
          { error: error.message || '积分不足，无法拆解图层' },
          { status: 402 }
        );
      }
    }

    console.log(`💰 当前剩余积分: ${newCredits}`);

    // 4. 调用 Replicate 拆图
    console.log('📤 调用 Replicate Qwen-Image-Layered 模型...');
    const output = await replicate.run(
      "qwen/qwen-image-layered",
      {
        input: {
          image: imageUrl,
          num_layers: 4,
          description: "auto",
          go_fast: true,
          output_format: "png",
          output_quality: 95,
        }
      }
    );

    if (!Array.isArray(output)) {
      throw new Error(`意外的输出格式：${typeof output}`);
    }

    // 调试日志（保留原有）
    console.log('📦 输出长度:', output.length);
    (output as any[]).forEach((item: any, idx: number) => {
      console.log(`item[${idx}] 类型:`, typeof item);
      console.log(`item[${idx}] 属性:`, Object.keys(item));
      console.log(`item[${idx}].url 类型:`, typeof item.url);
      console.log(`item[${idx}].url 调用结果:`, typeof item.url === 'function' ? item.url() : item.url);
    });

    // 5. 处理图层数据（不变）
    const layers = await Promise.all(
      (output as any[]).map(async (item: any, index: number) => {
        let buffer: Buffer;

        if (item && typeof item === 'object') {
          let url: string | null = null;

          if (typeof item.url === 'function') {
            url = item.url();
          } else if (typeof item.url === 'string') {
            url = item.url;
          } else if ('url' in item && typeof (item as any).url === 'string') {
            url = (item as any).url;
          }

          if (url) {
            console.log(`图层 ${index+1} 下载中: ${url}`);
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          } else if ('data' in item) {
            const data = (item as any).data;
            if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
              buffer = Buffer.from(data);
            } else if (typeof data === 'string') {
              buffer = Buffer.from(data, 'base64');
            } else {
              throw new Error(`图层 ${index+1} 的 data 字段无法处理`);
            }
          } else if (Buffer.isBuffer(item) || item instanceof Uint8Array) {
            buffer = Buffer.from(item);
          } else {
            console.warn(`图层 ${index+1} 无有效 URL 或 data，尝试序列化`);
            buffer = Buffer.from(JSON.stringify(item));
          }
        } else if (typeof item === 'string') {
          if (item.startsWith('http')) {
            const response = await fetch(item);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          } else {
            buffer = Buffer.from(item, 'base64');
          }
        } else if (Buffer.isBuffer(item) || item instanceof Uint8Array) {
          buffer = Buffer.from(item);
        } else {
          throw new Error(`图层 ${index+1} 格式不支持: ${typeof item}`);
        }

        if (buffer.length === 0) {
          throw new Error(`图层 ${index+1} 下载后为空`);
        }

        return {
          name: `图层${index + 1}`,
          data: buffer.toString('base64'),
          width: 1024,
          height: 1024,
          opacity: 1,
        };
      })
    );

    console.log(`✅ 成功拆解 ${layers.length} 个图层，消耗 ${CREDITS_PER_LAYER} 积分`);
    // 6. 返回结果（包含剩余积分）
    return NextResponse.json({
      success: true,
      layers,
      credits: newCredits,   // ← 关键：返回剩余积分供前端更新
    });

  } catch (error: any) {
    console.error('❌ 拆图失败:', error);
    return NextResponse.json(
      { error: error.message || '拆图处理失败' },
      { status: 500 }
    );
  }
}