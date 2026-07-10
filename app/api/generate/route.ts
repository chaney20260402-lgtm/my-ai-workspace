// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkAndDeductCredits } from '@/lib/credits';
import { createUsageLog } from '@/lib/usageLog';

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
      // ✅ 纯文本时添加“生成一张图片”指令，有参考图时直接用原提示词
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
      // ✅ 纯文本时添加“生成一张图片”指令
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
        // ❌ 移除 output_format
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
        // ❌ 移除 output_format
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

    const APIYI_KEY = process.env.APIYI_KEY;
    if (!APIYI_KEY) {
      console.error('❌ APIYI_KEY 未设置');
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // 4. 构建增强提示词
    const enhancedPrompt = buildEnhancedPrompt(prompt, platform, language);
    console.log(`📝 增强后提示词: ${enhancedPrompt.substring(0, 150)}...`);

    // 5. 调用 API（先不扣积分）
    const payload = config.buildPayload(enhancedPrompt, size, aspectRatio, referenceImages);
    console.log(`📤 调用模型: ${model}, 尺寸: ${size}, 比例: ${aspectRatio}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    let imageUrl: string | null = null;
    let apiError: any = null;

    try {
      // ✅ 新增：请求日志
  console.log(`📤 调用模型: ${model}, 尺寸: ${size}, 比例: ${aspectRatio}`);
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
        // ✅ 新增：响应日志
    console.log(`📥 API 响应状态: ${response.status}`);
    console.log(`📥 API 响应数据:`, JSON.stringify(data, null, 2));
        imageUrl = config.extractImage(data);
        if (!imageUrl) {
          console.error('❌ 未提取到图片:', data);
          apiError = new Error('生成失败，未返回图片');
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

    // 7. API 成功，现在扣除积分
    const costPerImage = 8;
    const totalCost = costPerImage * quantity;
    let newCredits: number;

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`⚠️ 开发模式：跳过实际积分扣除，假装消耗 ${totalCost} 积分`);
      newCredits = 100 - totalCost;
    } else {
      try {
        newCredits = await checkAndDeductCredits(userPhone, totalCost, `生成图片（${model}）`);
        // ✅ 生产模式：扣积分成功后记录日志
    await createUsageLog({
      userPhone: userPhone,
      model: model,
      mode: 'generate',
      creditsUsed: totalCost,
      prompt: enhancedPrompt,
      success: true,
    });
        
      } catch (error: any) {
        console.error('❌ 积分扣除失败:', error.message);
        // 虽然图片生成了，但积分扣失败，返回错误（但已生成的图片无法撤回，需要记录）
        return NextResponse.json(
          { error: error.message || '积分扣除失败，请检查余额' },
          { status: 402 }
        );
      }
    }

    console.log(`💰 当前剩余积分: ${newCredits}`);
    // 此时 imageUrl 一定不为 null（因为 apiError 为 null，且 extractImage 已返回有效值）
    console.log(`✅ 生成成功，图片长度: ${imageUrl!.length}`);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl!, // 非空断言，因为已确保成功
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