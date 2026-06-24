// app/api/generate/route.ts
import { NextResponse } from 'next/server';

export const maxDuration = 60; // 允许最长 60 秒执行时间

// ✅ 尺寸和比例映射（预设）
const sizePresets: Record<string, string> = {
  '1K': '1024x1024',
  '2K': '2048x2048',
  '4K': '4096x4096',
};

// 比例映射：确保 API 易支持这些尺寸
const aspectRatioToSize: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1, height: 1 },
  '16:9': { width: 16, height: 9 },
  '4:3': { width: 4, height: 3 },
  '3:4': { width: 3, height: 4 },
  '9:16': { width: 9, height: 16 },
};

export async function POST(request: Request) {
  try {
    const { prompt, model, size, aspectRatio } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    const APIYI_KEY = process.env.APIYI_KEY;
    if (!APIYI_KEY) {
      console.error('❌ APIYI_KEY 未设置');
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // 根据模型选择 API 端点
    let apiUrl = '';
    let payload: any = {};

    if (model === 'nano-banana') {
      apiUrl = 'https://api.apiyi.com/v1beta/models/gemini-3-pro-image-preview:generateContent';
      payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            imageSize: size || '2K',
            aspectRatio: aspectRatio || '1:1',
          },
        },
      };
    } else if (model === 'gpt-image-2') {
      const baseSize = sizePresets[size] || '1024x1024';
      const ratio = aspectRatioToSize[aspectRatio] || { width: 1, height: 1 };
      const base = parseInt(baseSize.split('x')[0]); // 取宽或高作为基准
      let width = base;
      let height = base;
      if (ratio.width > ratio.height) {
        height = Math.round(base / (ratio.width / ratio.height));
        width = base;
      } else if (ratio.width < ratio.height) {
        width = Math.round(base / (ratio.height / ratio.width));
        height = base;
      } else {
        width = base;
        height = base;
      }
      // 确保尺寸是 8 的倍数（API 要求）
      width = Math.floor(width / 8) * 8;
      height = Math.floor(height / 8) * 8;
      const gptSize = `${width}x${height}`;

      apiUrl = 'https://api.apiyi.com/v1/images/generations';
      payload = {
        model: 'gpt-image-2',
        prompt: prompt,
        n: 1,
        size: gptSize,
        quality: 'medium',
        output_format: 'png',
      };
    } else {
      return NextResponse.json({ error: '不支持的模型' }, { status: 400 });
    }

    console.log(`📤 调用 API: ${model} 尺寸: ${size} 比例: ${aspectRatio}`);

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 秒超时

    try {
      const response = await fetch(apiUrl, {
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

      let imageUrl = '';
      if (model === 'nano-banana') {
        const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (imageData) {
          imageUrl = `data:image/png;base64,${imageData}`;
        }
      } else {
        const imageData = data.data?.[0];
        if (imageData?.b64_json) {
          imageUrl = `data:image/png;base64,${imageData.b64_json}`;
        } else if (imageData?.url) {
          imageUrl = imageData.url;
        }
      }

      if (!imageUrl) {
        console.error('❌ 未提取到图片:', data);
        return NextResponse.json({ error: '生成失败，未返回图片' }, { status: 500 });
      }

      console.log(`✅ 生成成功，图片长度: ${imageUrl.length}`);
      return NextResponse.json({ success: true, imageUrl });

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