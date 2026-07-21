// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createUsageLog } from '@/lib/usageLog';
import { put } from '@vercel/blob'; // ✅ 新增

export const maxDuration = 60;

// ========== 平台列表 ==========
const PLATFORMS = [
  { value: 'taobao', label: '淘宝' },
  { value: 'jd', label: '京东' },
  { value: 'pinduoduo', label: '拼多多' },
  { value: 'tmall', label: '天猫' },
  { value: 'suning', label: '苏宁' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'ebay', label: 'eBay' },
  { value: 'aliexpress', label: 'AliExpress' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'walmart', label: 'Walmart' },
  { value: 'etsy', label: 'Etsy' },
  { value: 'mercadolibre', label: 'MercadoLibre' },
  { value: 'rakuten', label: 'Rakuten' },
  { value: 'coupang', label: 'Coupang' },
  { value: 'lazada', label: 'Lazada' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'temu', label: 'Temu' },
  { value: 'shein', label: 'Shein' },
];

// ========== 语言列表 ==========
const LANGUAGES = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'it', label: 'Italiano' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'sv', label: 'Svenska' },
  { value: 'pl', label: 'Polski' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'th', label: 'ไทย' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
];

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

// ========== 辅助函数：构建增强提示词 ==========
function buildEnhancedPrompt(originalPrompt: string, platform?: string, language?: string): string {
  let enhanced = originalPrompt;
  const platformLabel = PLATFORMS.find(p => p.value === platform)?.label;
  const languageLabel = LANGUAGES.find(l => l.value === language)?.label;

  if (platformLabel) {
    enhanced = `【电商平台：${platformLabel}】${enhanced}`;
  }
  if (languageLabel) {
    enhanced = `【语言：${languageLabel}】${enhanced}`;
  }
  return enhanced;
}

// ========== 模型配置表 ==========
const modelConfigs: Record<string, any> = {
  // ============================================================
  // 1. nanobanana-pro（Gemini 格式，支持参考图）
  // ============================================================
  'nanobanana-pro': {
    endpoint: 'https://api.apiyi.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const parts: any[] = [];
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      parts.push({ text: finalPrompt });

      if (referenceImages && referenceImages.length > 0) {
        for (const imgData of referenceImages) {
          const base64 = imgData.split(',')[1] || imgData;
          parts.push({
            inline_data: {
              mime_type: 'image/png',
              data: base64,
            },
          });
        }
      }
      return {
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            imageSize: size || '2K',
            aspectRatio: aspectRatio || '1:1',
          },
        },
      };
    },
    extractImage: (data: any) => {
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
      return imagePart ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` : null;
    },
  },

  // ============================================================
  // 2. nano-banana（Gemini 格式，支持参考图）
  // ============================================================
  'nano-banana': {
    endpoint: 'https://api.apiyi.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const parts: any[] = [];
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      parts.push({ text: finalPrompt });

      if (referenceImages && referenceImages.length > 0) {
        for (const imgData of referenceImages) {
          const base64 = imgData.split(',')[1] || imgData;
          parts.push({
            inline_data: {
              mime_type: 'image/png',
              data: base64,
            },
          });
        }
      }
      return {
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            imageSize: size || '2K',
            aspectRatio: aspectRatio || '1:1',
          },
        },
      };
    },
    extractImage: (data: any) => {
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
      return imagePart ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` : null;
    },
  },

  // ============================================================
  // 3. nano-banana-2（Gemini 格式，支持参考图）
  // ============================================================
  'nano-banana-2': {
    endpoint: 'https://api.apiyi.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const parts: any[] = [];
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      parts.push({ text: finalPrompt });

      if (referenceImages && referenceImages.length > 0) {
        for (const imgData of referenceImages) {
          const base64 = imgData.split(',')[1] || imgData;
          parts.push({
            inline_data: {
              mime_type: 'image/png',
              data: base64,
            },
          });
        }
      }
      return {
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            imageSize: size || '2K',
            aspectRatio: aspectRatio || '1:1',
          },
        },
      };
    },
    extractImage: (data: any) => {
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
      return imagePart ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` : null;
    },
  },

  // ============================================================
  // 4. gemini-3-pro-image-preview（Gemini 格式，支持参考图）
  // ============================================================
  'gemini-3-pro-image-preview': {
    endpoint: 'https://api.apiyi.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const parts: any[] = [];
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      parts.push({ text: finalPrompt });

      if (referenceImages && referenceImages.length > 0) {
        for (const imgData of referenceImages) {
          const base64 = imgData.split(',')[1] || imgData;
          parts.push({
            inline_data: {
              mime_type: 'image/png',
              data: base64,
            },
          });
        }
      }
      return {
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            imageSize: size || '2K',
            aspectRatio: aspectRatio || '1:1',
          },
        },
      };
    },
    extractImage: (data: any) => {
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
      return imagePart ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` : null;
    },
  },

  // ============================================================
  // 5. gpt-image-2（OpenAI 兼容格式）
  // ============================================================
  'gpt-image-2': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      const baseSize = sizePresets[size] || '1024x1024';
      return {
        model: 'gpt-image-2',
        prompt: finalPrompt,
        n: 1,
        size: baseSize,
        quality: 'medium',
      };
    },
    extractImage: (data: any) => {
      const imageData = data.data?.[0];
      return imageData?.b64_json ? `data:image/png;base64,${imageData.b64_json}` : imageData?.url || null;
    },
  },

  // ============================================================
  // 6. gpt-image-2-all（OpenAI 兼容格式）
  // ============================================================
  'gpt-image-2-all': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      return {
        model: 'gpt-image-2-all',
        prompt: finalPrompt,
        n: 1,
        size: sizePresets[size] || '1024x1024',
      };
    },
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },

  // ============================================================
  // 7. seedream-5-0-260128（OpenAI 兼容格式）
  // ============================================================
  'seedream-5-0-260128': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      return {
        model: 'seedream-5-0-260128',
        prompt: finalPrompt,
        n: 1,
        size: sizePresets[size] || '1024x1024',
        aspect_ratio: aspectRatio || '1:1',
      };
    },
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },

  // ============================================================
  // 8. flux-2-pro（OpenAI 兼容格式）
  // ============================================================
  'flux-2-pro': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      return {
        model: 'flux-2-pro',
        prompt: finalPrompt,
        n: 1,
        size: sizePresets[size] || '1024x1024',
        aspect_ratio: aspectRatio || '1:1',
      };
    },
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },

  // ============================================================
  // 9. flux-2-max（OpenAI 兼容格式）
  // ============================================================
  'flux-2-max': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      return {
        model: 'flux-2-max',
        prompt: finalPrompt,
        n: 1,
        size: sizePresets[size] || '1024x1024',
        aspect_ratio: aspectRatio || '1:1',
      };
    },
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },

  // ============================================================
  // 10. flux-2-flex（OpenAI 兼容格式）
  // ============================================================
  'flux-2-flex': {
    endpoint: 'https://api.apiyi.com/v1/images/generations',
    buildPayload: (prompt: string, size: string, aspectRatio: string, referenceImages?: string[]) => {
      const finalPrompt = referenceImages && referenceImages.length > 0
        ? prompt
        : `生成一张图片：${prompt}`;
      return {
        model: 'flux-2-flex',
        prompt: finalPrompt,
        n: 1,
        size: sizePresets[size] || '1024x1024',
        aspect_ratio: aspectRatio || '1:1',
      };
    },
    extractImage: (data: any) => data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null,
  },
};

// ========== POST 处理 ==========
export async function POST(request: Request) {
  try {
    // 1. 获取请求参数
    const {
      prompt,
      model,
      size,
      aspectRatio,
      quantity = 1,
      platform,
      language,
      referenceImages,
    } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '请输入描述词' }, { status: 400 });
    }

    // 2. 获取当前登录用户
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const userPhone = session.user.phone;

    // 3. 检查模型配置
    const config = modelConfigs[model];
    if (!config) {
      return NextResponse.json({ error: '不支持的模型' }, { status: 400 });
    }

    // ============================================================
    // ✅ 积分检查（直接从数据库查询）
    // ============================================================
    const costPerImage = 8;
    const totalCost = costPerImage * quantity;

    const user = await prisma.user.findUnique({
      where: { phone: userPhone },
      select: { credits: true },
    });
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    if (user.credits < totalCost) {
      return NextResponse.json(
        { error: `积分不足，需要 ${totalCost} 积分，当前 ${user.credits} 积分` },
        { status: 402 }
      );
    }

    // 4. 构建增强提示词
    const enhancedPrompt = buildEnhancedPrompt(prompt, platform, language);
    console.log(`📝 增强后提示词: ${enhancedPrompt.substring(0, 150)}...`);

    const APIYI_KEY = process.env.APIYI_KEY;
    if (!APIYI_KEY) {
      console.error('❌ APIYI_KEY 未设置');
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // 5. 调用 API（先不扣积分）
    const payload = config.buildPayload(enhancedPrompt, size, aspectRatio, referenceImages);
    console.log(`📤 调用模型: ${model}, 尺寸: ${size}, 比例: ${aspectRatio}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    let imageBase64: string | null = null;
    let apiError: any = null;

    try {
      console.log(`📤 请求 Payload:`, JSON.stringify(payload, null, 2));
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
        apiError = new Error(`API 调用失败: ${response.status} - ${errorText}`);
      } else {
        const data = await response.json();
        console.log(`📥 API 响应状态: ${response.status}`);
        console.log(`📥 API 响应数据:`, JSON.stringify(data, null, 2));
        const extracted = config.extractImage(data);
        if (!extracted) {
          console.error('❌ 未提取到图片:', data);
          apiError = new Error('生成失败，未返回图片');
        } else {
          imageBase64 = extracted; // 例如 data:image/png;base64,...
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ 请求超时');
        apiError = new Error('生成超时，请稍后重试');
      } else {
        apiError = fetchError;
      }
    }

    // 6. 如果 API 调用失败，直接返回错误（不扣积分）
    if (apiError) {
      console.error('❌ 生成失败:', apiError);
      return NextResponse.json(
        { error: apiError.message || '生成失败，请重试' },
        { status: 500 }
      );
    }

    // ============================================================
    // ✅ 将 base64 图片上传到 Vercel Blob，获得 URL
    // ============================================================
    let finalImageUrl: string;
    try {
      // 从 data:image/png;base64,xxxx 中提取纯 base64
      const matches = imageBase64!.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        throw new Error('无效的图片数据');
      }
      const mimeType = `image/${matches[1]}`;
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const blob = await put(
        `generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${matches[1]}`,
        buffer,
        {
          access: 'public',
          contentType: mimeType,
        }
      );
      finalImageUrl = blob.url;
      console.log(`✅ 图片上传到 Blob: ${finalImageUrl}`);
    } catch (uploadError: any) {
      console.error('❌ 上传到 Blob 失败:', uploadError);
      // 如果上传失败，降级返回 base64（但可能导致响应过大）
      finalImageUrl = imageBase64!;
    }

    // ============================================================
    // ✅ 扣减积分（事务）
    // ============================================================
    let newCredits: number;
    try {
      const updatedUser = await prisma.$transaction(async (tx) => {
        const current = await tx.user.findUnique({
          where: { phone: userPhone },
          select: { credits: true },
        });
        if (!current || current.credits < totalCost) {
          throw new Error('积分不足');
        }

        const updated = await tx.user.update({
          where: { phone: userPhone },
          data: { credits: { decrement: totalCost } },
          select: { credits: true },
        });

        await tx.creditTransaction.create({
          data: {
            userPhone: userPhone,
            amount: -totalCost,
            type: 'generate',
            description: `图片生成 (${model})`,
          },
        });

        return updated;
      });
      newCredits = updatedUser.credits;

      // 记录使用日志
      await createUsageLog({
        userPhone: userPhone,
        model: model,
        mode: 'generate',
        creditsUsed: totalCost,
        prompt: enhancedPrompt,
        success: true,
      });

    } catch (txError: any) {
      console.error('❌ 积分扣除失败:', txError.message);
      return NextResponse.json(
        { error: txError.message || '积分不足，请充值' },
        { status: 402 }
      );
    }

    console.log(`💰 当前剩余积分: ${newCredits}`);
    console.log(`✅ 生成成功，图片 URL: ${finalImageUrl}`);

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,  // ✅ 返回 URL（或 base64 降级）
      credits: newCredits,
    });
  } catch (error: any) {
    console.error('❌ 生成错误:', error);
    return NextResponse.json(
      { error: error.message || '生成失败，请重试' },
      { status: 500 }
    );
  }
}