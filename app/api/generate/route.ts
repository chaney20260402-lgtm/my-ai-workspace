import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt, model, size } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    const APIYI_KEY = process.env.APIYI_KEY;
    if (!APIYI_KEY) {
      console.error('❌ APIYI_KEY 未设置');
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    const sizeMap: Record<string, string> = {
      '1K': '1024x1024',
      '2K': '1792x1024',
      '4K': '1792x1792',
    };

    let apiUrl = '';
    let payload: any = {};

    if (model === 'nano-banana') {
      apiUrl = 'https://api.apiyi.com/v1beta/models/gemini-3-pro-image-preview:generateContent';
      payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { imageSize: size || '2K' },
        },
      };
    } else if (model === 'gpt-image-2') {
      apiUrl = 'https://api.apiyi.com/v1/images/generations';
      payload = {
        model: 'gpt-image-2',
        prompt: prompt,
        n: 1,
        size: sizeMap[size] || '1024x1024',
        quality: 'medium',
        output_format: 'png',
      };
    } else {
      return NextResponse.json({ error: '不支持的模型' }, { status: 400 });
    }

    console.log('📤 调用 API:', model, '尺寸:', size);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIYI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

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
      // ✅ 修复：gpt-image-2 返回 b64_json 而不是 url
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

    console.log('✅ 生成成功，图片长度:', imageUrl.length);
    return NextResponse.json({ success: true, imageUrl });

  } catch (error) {
    console.error('❌ 生成错误:', error);
    return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 });
  }
}