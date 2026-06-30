import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkAndDeductCredits } from '@/lib/credits';

export const maxDuration = 60;

// ========== 尺寸预设 ==========
const sizePresets: Record<string, string> = {
  '1K': '1024x1024',
  '2K': '2048x2048',
  '4K': '4096x4096',
};

// ========== 比例映射 ==========
const aspectRatioToSize: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1, height: 1 },
  '16:9': { width: 16, height: 9 },
  '4:3': { width: 4, height: 3 },
  '3:4': { width: 3, height: 4 },
  '9:16': { width: 9, height: 16 },
};

// ========== 模型配置表（保持不变） ==========
const modelConfigs: Record<string, any> = {
  // ---------- Gemini 格式 ----------
  'nanobanana-pro': {
    endpoint: 'https://api.apiyi.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          imageSize: size || '2K',
          aspectRatio: aspectRatio || '1:1',
        },
      },
    }),
    extractImage: (data: any) => {
      const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return imageData ? `data:image/png;base64,${imageData}` : null;
    },
  },
  'nanobanana-2': {
    endpoint: 'https://api.apiyi.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          imageSize: size || '2K',
          aspectRatio: aspectRatio || '1:1',
        },
      },
    }),
    extractImage: (data: any) => {
      const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return imageData ? `data:image/png;base64,${imageData}` : null;
    },
  },

  // ---------- OpenAI 格式 ----------
  'gpt-image-2': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => {
      const baseSize = sizePresets[size] || '1024x1024';
      const ratio = aspectRatioToSize[aspectRatio] || { width: 1, height: 1 };
      const base = parseInt(baseSize.split('x')[0]);
      let width = base, height = base;
      if (ratio.width > ratio.height) { height = Math.round(base / (ratio.width / ratio.height)); width = base; }
      else if (ratio.width < ratio.height) { width = Math.round(base / (ratio.height / ratio.width)); height = base; }
      width = Math.floor(width / 8) * 8;
      height = Math.floor(height / 8) * 8;
      return {
        model: 'gpt-image-2',
        prompt,
        n: 1,
        size: `${width}x${height}`,
        quality: 'medium',
        output_format: 'png',
      };
    },
    extractImage: (data: any) => {
      const imageData = data.data?.[0];
      return imageData?.b64_json ? `data:image/png;base64,${imageData.b64_json}` : imageData?.url || null;
    },
  },
  'seedream-5.0-lite': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      model: 'seedream-5.0-lite',
      prompt,
      n: 1,
      size: sizePresets[size] || '1024x1024',
      aspect_ratio: aspectRatio || '1:1',
      output_format: 'png',
    }),
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
  'seedream-4.5': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      model: 'seedream-4.5',
      prompt,
      n: 1,
      size: sizePresets[size] || '1024x1024',
      aspect_ratio: aspectRatio || '1:1',
      output_format: 'png',
    }),
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
  'seedream-4.0': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      model: 'seedream-4.0',
      prompt,
      n: 1,
      size: sizePresets[size] || '1024x1024',
      aspect_ratio: aspectRatio || '1:1',
      output_format: 'png',
    }),
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
  'wan-2.7': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      model: 'wan-2.7',
      prompt,
      n: 1,
      size: sizePresets[size] || '1024x1024',
      aspect_ratio: aspectRatio || '1:1',
      output_format: 'png',
    }),
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
  'wan-2.7-pro': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      model: 'wan-2.7-pro',
      prompt,
      n: 1,
      size: sizePresets[size] || '1024x1024',
      aspect_ratio: aspectRatio || '1:1',
      output_format: 'png',
    }),
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
  'wan-2.6': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      model: 'wan-2.6',
      prompt,
      n: 1,
      size: sizePresets[size] || '1024x1024',
      aspect_ratio: aspectRatio || '1:1',
      output_format: 'png',
    }),
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
  'qwen-edit-max': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      model: 'qwen-edit-max',
      prompt,
      n: 1,
      size: sizePresets[size] || '1024x1024',
      aspect_ratio: aspectRatio || '1:1',
      output_format: 'png',
    }),
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
  'midjourney-v8.1': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      model: 'midjourney-v8.1',
      prompt,
      n: 1,
      size: sizePresets[size] || '1024x1024',
      aspect_ratio: aspectRatio || '1:1',
      output_format: 'png',
    }),
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
  'midjourney-niji': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string) => ({
      model: 'midjourney-niji',
      prompt,
      n: 1,
      size: sizePresets[size] || '1024x1024',
      aspect_ratio: aspectRatio || '1:1',
      output_format: 'png',
    }),
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
};

// ========== POST 处理 ==========
export async function POST(request: Request) {
  try {
    // 1. 获取请求参数
    const { prompt, model, size, aspectRatio, quantity = 1 } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    // 2. 获取当前登录用户
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const userPhone = session.user.phone;

    // 3. 积分扣除（每张 8 积分）
    const costPerImage = 8;
    const totalCost = costPerImage * quantity;
    let newCredits: number;

    // ---------- 开发环境跳过积分扣除（方便测试） ----------
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`⚠️ 开发模式：跳过实际积分扣除，假装消耗 ${totalCost} 积分`);
      // 模拟扣除后的余额（假设原余额为 100，扣除后为 100 - totalCost）
      newCredits = 100 - totalCost; // 仅用于前端展示，实际未修改数据库
      // 如果你希望真实扣除，可以注释掉上面的 if，或者设置环境变量强制扣除
    } else {
      try {
        newCredits = await checkAndDeductCredits(userPhone, totalCost, `生成图片（${model}）`);
      } catch (error: any) {
        console.error('❌ 积分扣除失败:', error.message);
        return NextResponse.json(
          { error: error.message || '积分扣除失败，请检查余额' },
          { status: 402 }
        );
      }
    }

    console.log(`💰 当前剩余积分: ${newCredits}`);

    // 4. 检查模型配置
    const config = modelConfigs[model];
    if (!config) {
      return NextResponse.json({ error: '不支持的模型' }, { status: 400 });
    }

    const APIYI_KEY = process.env.APIYI_KEY;
    if (!APIYI_KEY) {
      console.error('❌ APIYI_KEY 未设置');
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // 5. 调用 API
    const payload = config.buildPayload(prompt, size, aspectRatio);
    console.log(`📤 调用模型: ${model}, 尺寸: ${size}, 比例: ${aspectRatio}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIYI_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 错误:', errorText);
        return NextResponse.json(
          { error: `API 调用失败: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      const imageUrl = config.extractImage(data);

      if (!imageUrl) {
        console.error('❌ 未提取到图片:', data);
        return NextResponse.json({ error: '生成失败，未返回图片' }, { status: 500 });
      }

      console.log(`✅ 生成成功，图片长度: ${imageUrl.length}`);
      return NextResponse.json({
        success: true,
        imageUrl,
        credits: newCredits,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ 请求超时');
        return NextResponse.json({ error: '生成超时，请稍后重试' }, { status: 504 });
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('❌ 生成错误:', error);
    return NextResponse.json(
      { error: error.message || '生成失败，请重试' },
      { status: 500 }
    );
  }
}