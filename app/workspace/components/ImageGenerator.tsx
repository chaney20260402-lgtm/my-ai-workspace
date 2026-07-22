'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Input, Select, Card, Spin, message, Row, Col, Divider, Image as AntImage, Tag, Space } from 'antd';
import { DeleteOutlined, FilePdfOutlined, PlusOutlined, CloseCircleOutlined } from '@ant-design/icons';
import JSZip from 'jszip';
import { useCredits } from '@/app/contexts/CreditsContext';
import LoadingProgressModal from './LoadingProgressModal';
import { OpenAI, Claude, Gemini, DeepSeek, Qwen } from '@lobehub/icons';
import { StarOutlined, ThunderboltOutlined, ExperimentOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { put } from '@vercel/blob';
import { useSession } from 'next-auth/react';

const { TextArea } = Input;

interface ImageGeneratorProps {
  initialPrompt?: string;
  initialModel?: string;
  initialSize?: string;
  initialAspectRatio?: string;
  membershipType?: string;
  initialImages?: GeneratedImage[];
  onGenerateSuccess?: (imageUrl: string) => void;
  onPromptChange?: (prompt: string) => void;
  onImagesChange?: (images: GeneratedImage[]) => void;
  initialPrompts?: string[];
  initialReferenceImages?: string[];
  onModelChange?: (model: string) => void;
  onSizeChange?: (size: string) => void;
  onAspectRatioChange?: (aspect: string) => void;
  onPlatformChange?: (platform: string) => void;
  onLanguageChange?: (language: string) => void;
  onPromptsChange?: (prompts: string[]) => void;
  onReferenceImagesChange?: (images: string[]) => void;
}
interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  loading: boolean;
  platform: string;
  language: string;
  referenceImages?: string[];
}

// ---------- 平台列表 ----------
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

// ---------- 语言列表 ----------
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

const providerIcons: Record<string, React.ReactNode> = {
  openai: <OpenAI size={18} />,
  anthropic: <Claude size={18} />,
  gemini: <Gemini size={18} />,
  deepseek: <DeepSeek size={18} />,
  qwen: <Qwen size={18} />,
  banana: <ThunderboltOutlined style={{ fontSize: 18, color: '#f59e0b' }} />,
  seedream: <ExperimentOutlined style={{ fontSize: 18, color: '#8b5cf6' }} />,
  wan: <ExperimentOutlined style={{ fontSize: 18, color: '#06b6d4' }} />,
  midjourney: <ExperimentOutlined style={{ fontSize: 18, color: '#ec4899' }} />,
  flux: <ExperimentOutlined style={{ fontSize: 18, color: '#a78bfa' }} />,
  default: <StarOutlined style={{ fontSize: 18 }} />,
};

const modelOptions = [
  { 
    value: 'nanobanana-pro', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.banana}
        Nano Banana Pro
      </span>
    )
  },
  { 
    value: 'nano-banana', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.banana}
        Nano Banana
      </span>
    )
  },
  { 
    value: 'nano-banana-2', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.banana}
        Nano Banana 2
      </span>
    )
  },
  { 
    value: 'gpt-image-2', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.openai}
        GPT Image 2
      </span>
    )
  },
  { 
    value: 'gpt-image-2-all', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.openai}
        GPT Image 2 All
      </span>
    )
  },
  { 
    value: 'gemini-3-pro-image-preview', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.gemini}
        Gemini 3 Pro Image
      </span>
    )
  },
  { 
    value: 'seedream-5-0-260128', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.seedream}
        Seedream 5.0
      </span>
    )
  },
  { 
    value: 'flux-2-pro', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.flux}
        Flux 2 Pro
      </span>
    )
  },
  { 
    value: 'flux-2-max', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.flux}
        Flux 2 Max
      </span>
    )
  },
  { 
    value: 'flux-2-flex', 
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {providerIcons.flux}
        Flux 2 Flex
      </span>
    )
  },
];

export default function ImageGenerator({
  initialPrompt = '',
  initialModel = 'nanobanana-pro',
  initialSize = '2K',
  initialAspectRatio = '1:1',
  initialImages = [],
  onGenerateSuccess,
  onPromptChange,
  onImagesChange,
  initialPrompts = [],
  initialReferenceImages = [],
  onModelChange,
  onSizeChange,
  onAspectRatioChange,
  onPlatformChange,
  onLanguageChange,
  onPromptsChange,
  onReferenceImagesChange,
  membershipType = 'experience',
}: ImageGeneratorProps) {
  const { setCredits } = useCredits();
  const router = useRouter();
  const { data: session } = useSession();
  const [model, setModel] = useState(initialModel);
  const [size, setSize] = useState(initialSize);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
  const [platform, setPlatform] = useState('taobao');
  const [language, setLanguage] = useState('zh');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [prompts, setPrompts] = useState<string[]>([initialPrompt || '']);
  const [loading, setLoading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressTitle, setProgressTitle] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(initialImages);

  // 当数量变化时，调整prompts数组长度
  useEffect(() => {
    setPrompts(prev => {
      const newPrompts = [...prev];
      while (newPrompts.length < quantity) {
        newPrompts.push('');
      }
      const result = newPrompts.slice(0, quantity);
      if (onPromptsChange) {
        onPromptsChange(result);
      }
      return result;
    });
  }, [quantity]);

  useEffect(() => {
    if (initialPrompt && prompts[0] !== initialPrompt) {
      setPrompts(prev => {
        const newPrompts = [...prev];
        newPrompts[0] = initialPrompt;
        return newPrompts;
      });
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (onPromptChange && prompts.length > 0 && prompts[0] !== undefined) {
      onPromptChange(prompts[0]);
    }
  }, [prompts, onPromptChange]);

  useEffect(() => {
    if (onModelChange) onModelChange(model);
  }, [model, onModelChange]);

  useEffect(() => {
    if (onSizeChange) onSizeChange(size);
  }, [size, onSizeChange]);

  useEffect(() => {
    if (onAspectRatioChange) onAspectRatioChange(aspectRatio);
  }, [aspectRatio, onAspectRatioChange]);

  useEffect(() => {
    if (onPlatformChange) onPlatformChange(platform);
  }, [platform, onPlatformChange]);

  useEffect(() => {
    if (onLanguageChange) onLanguageChange(language);
  }, [language, onLanguageChange]);

  useEffect(() => {
    if (initialPrompts && initialPrompts.length > 0) {
      setPrompts(initialPrompts);
    }
  }, [initialPrompts]);

  useEffect(() => {
    if (initialReferenceImages) {
      setReferenceImages(initialReferenceImages);
    }
  }, [initialReferenceImages]);

  const updatePrompt = (index: number, value: string) => {
    setPrompts(prev => {
      const newPrompts = [...prev];
      newPrompts[index] = value;
      if (onPromptsChange) {
        onPromptsChange(newPrompts);
      }
      return newPrompts;
    });
  };

  // ✅ 参考图上传（直传 Blob）
  const handleRefUpload = async (file: File) => {
    if (referenceImages.length >= 8) {
      message.warning('最多上传8张参考图');
      return;
    }

    try {
      const blob = await put(`${Date.now()}-${file.name}`, file, {
        access: 'public',
        token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
      });

      const newImages = [...referenceImages, blob.url];
      setReferenceImages(newImages);
      if (onReferenceImagesChange) {
        onReferenceImagesChange(newImages);
      }
      message.success('参考图上传成功！');
    } catch (error) {
      console.error('上传失败:', error);
      message.error('参考图上传失败');
    }
  };

  const removeReferenceImage = (index: number) => {
    const newImages = referenceImages.filter((_, i) => i !== index);
    setReferenceImages(newImages);
    if (onReferenceImagesChange) {
      onReferenceImagesChange(newImages);
    }
  };

  const updateImages = (newImages: GeneratedImage[]) => {
    setGeneratedImages(newImages);
    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  const handleGenerateAll = async () => {
    const validPrompts = prompts.filter(p => p.trim().length > 0);
    if (validPrompts.length === 0) {
      message.warning('请至少填写一个提示词');
      return;
    }
    setProgressTitle('正在生成图片...');
    setProgressVisible(true);
    setLoading(true);

    const platformLabel = PLATFORMS.find(p => p.value === platform)?.label || platform;
    const languageLabel = LANGUAGES.find(l => l.value === language)?.label || language;
    const refCount = referenceImages.length;
    const enhancedBase = `[平台: ${platformLabel}] [语言: ${languageLabel}]` + (refCount > 0 ? ` [参考图${refCount}张]` : '');

    const newImages: GeneratedImage[] = [];

    for (let i = 0; i < validPrompts.length; i++) {
      const fullPrompt = `${enhancedBase} ${validPrompts[i]}`;
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: fullPrompt,
            model,
            size,
            aspectRatio,
            platform,
            language,
            referenceImages: referenceImages, // 按顺序传递
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          if (response.status === 402) {
            message.error(data.error || '积分不足，请充值');
          } else {
            message.error(`第 ${i+1} 张生成失败: ${data.error || '未知错误'}`);
          }
          continue;
        }

        if (data.success && data.imageUrl) {
          if (data.credits !== undefined) {
            setCredits(data.credits);
          }
          message.success(`第 ${i+1} 张生成成功，剩余积分：${data.credits ?? '未知'}`);

          const newImg: GeneratedImage = {
            id: `${Date.now()}-${i}`,
            url: data.imageUrl,
            prompt: fullPrompt,
            loading: false,
            platform,
            language,
            referenceImages: refCount > 0 ? referenceImages : undefined,
          };
          newImages.push(newImg);
          if (onGenerateSuccess) {
            onGenerateSuccess(data.imageUrl);
          }
        } else {
          message.error(`第 ${i+1} 张生成失败: ${data.error || '未知错误'}`);
        }
      } catch (error) {
        console.error(`第 ${i+1} 张生成失败:`, error);
        message.error(`第 ${i+1} 张生成失败，请重试`);
      } finally {
        setProgressVisible(false);
        setLoading(false);
      }
    }

    const updatedList = [...generatedImages, ...newImages];
    updateImages(updatedList);
    if (newImages.length > 0) {
      message.success(`成功生成 ${newImages.length} 张图片`);
    }
    setLoading(false);
  };

  const handleRegenerate = async (imageId: string, newPrompt: string) => {
    if (!newPrompt.trim()) {
      message.warning('请输入描述词');
      return;
    }

    const updatedList = generatedImages.map((img) =>
      img.id === imageId ? { ...img, loading: true } : img
    );
    updateImages(updatedList);

    const img = generatedImages.find(i => i.id === imageId);
    const imgPlatform = img?.platform || platform;
    const imgLanguage = img?.language || language;
    const imgRefs = img?.referenceImages || [];

    const platformLabel = PLATFORMS.find(p => p.value === imgPlatform)?.label || imgPlatform;
    const languageLabel = LANGUAGES.find(l => l.value === imgLanguage)?.label || imgLanguage;
    let enhancedPrompt = `[平台: ${platformLabel}] [语言: ${languageLabel}]`;
    if (imgRefs.length > 0) {
      enhancedPrompt += ` [参考图${imgRefs.length}张]`;
    }
    enhancedPrompt += ` ${newPrompt}`;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          model,
          size,
          aspectRatio,
          platform: imgPlatform,
          language: imgLanguage,
          referenceImages: imgRefs,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          message.error(data.error || '积分不足，请充值');
        } else {
          message.error('重新生成失败: ' + (data.error || '未知错误'));
        }
        const restored = generatedImages.map((img) =>
          img.id === imageId ? { ...img, loading: false } : img
        );
        updateImages(restored);
        return;
      }

      if (data.success && data.imageUrl) {
        if (data.credits !== undefined) {
          setCredits(data.credits);
        }
        message.success(`✅ 重新生成成功，剩余积分：${data.credits ?? '未知'}`);

        const updated = generatedImages.map((img) =>
          img.id === imageId
            ? { ...img, url: data.imageUrl, prompt: enhancedPrompt, loading: false }
            : img
        );
        updateImages(updated);
        if (onGenerateSuccess) {
          onGenerateSuccess(data.imageUrl);
        }
      } else {
        message.error('重新生成失败: ' + (data.error || '未知错误'));
        const restored = generatedImages.map((img) =>
          img.id === imageId ? { ...img, loading: false } : img
        );
        updateImages(restored);
      }
    } catch (error) {
      console.error('重新生成失败:', error);
      message.error('重新生成失败');
      const restored = generatedImages.map((img) =>
        img.id === imageId ? { ...img, loading: false } : img
      );
      updateImages(restored);
    }
  };

  const handleDeleteImage = (id: string) => {
    const updated = generatedImages.filter((img) => img.id !== id);
    updateImages(updated);
  };

  const dataURLToBlob = (dataUrl: string): Blob => {
    let processedData = dataUrl;
    if (!dataUrl.startsWith('data:')) {
      processedData = `data:image/png;base64,${dataUrl}`;
    }
    const arr = processedData.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // ========== 修改后的导出PSD函数 ==========
  const handleExportPSD = async (imageUrl: string) => {
    const ADMIN_PHONE = '13929767725';
    const isAdmin = session?.user?.phone === ADMIN_PHONE;

    if (!isAdmin && membershipType === 'experience') {
      Modal.warning({
        title: '功能受限',
        content: '导出PSD功能仅限进阶会员和专业会员使用，请升级会员',
        okText: '去升级',
        onOk: () => {
          router.push('/workspace/pricing');
        },
      });
      return;
    }

    setProgressTitle('正在拆解图层...');
    setProgressVisible(true);

    try {
      const res = await fetch('/api/layer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || '拆图失败');
      }

      if (data.credits !== undefined) {
        setCredits(data.credits);
      }

      // 下载背景图
      const baseRes = await fetch(data.baseImage);
      if (!baseRes.ok) throw new Error('下载背景图失败');
      const baseBlob = await baseRes.blob();
      const baseBuffer = await baseRes.arrayBuffer();

      const zip = new JSZip();
      // 添加背景图层
      zip.file('背景.png', baseBlob);

      // 获取图片尺寸（用于绘制文本）
      const img = new Image();
      img.src = data.baseImage;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
      const imgWidth = img.width || 1920;
      const imgHeight = img.height || 1080;

      // 为每个文本块生成透明 PNG 图层
      for (let i = 0; i < data.textBlocks.length; i++) {
        const block = data.textBlocks[i];
        if (!block.bbox) continue;
        const { x, y, width, height } = block.bbox;

        const canvas = document.createElement('canvas');
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, imgWidth, imgHeight);

        // 根据块大小估算字号
        const fontSize = Math.min(width, height) * 0.8;
        ctx.font = `${fontSize}px "${block.font_name || 'Arial'}"`;
        ctx.fillStyle = block.color || '#000000';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillText(block.text || '', x, y, width);

        const pngDataUrl = canvas.toDataURL('image/png');
        const pngRes = await fetch(pngDataUrl);
        const pngBlob = await pngRes.blob();
        zip.file(`文本_${i+1}.png`, pngBlob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      if (zipBlob.size === 0) throw new Error('生成的 ZIP 为空');

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `layers_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('图层打包下载成功！');
    } catch (error: any) {
      console.error('导出失败:', error);
      message.error(error.message || '导出失败，请重试');
    } finally {
      setProgressVisible(false);
    }
  };

  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600 }}>文字生图</span>}
      variant="borderless"
      style={{ 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
      }}
      styles={{ body: { 
        padding: '18px', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'auto',
      }}}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <Select
          value={model}
          style={{ width: 180 }}
          onChange={(value) => setModel(value)}
          options={modelOptions}
          placeholder="模型"
        />
        <Select
          value={size}
          style={{ width: 100 }}
          onChange={(value) => setSize(value)}
          options={[
            { value: '1K', label: '1K' },
            { value: '2K', label: '2K' },
            { value: '4K', label: '4K' },
          ]}
        />
        <Select
          value={aspectRatio}
          style={{ width: 100 }}
          onChange={(value) => setAspectRatio(value)}
          options={[
            { value: '16:9', label: '16:9' },
            { value: '4:3', label: '4:3' },
            { value: '1:1', label: '1:1' },
            { value: '3:4', label: '3:4' },
            { value: '9:16', label: '9:16' },
          ]}
        />
        <Select
          value={platform}
          style={{ width: 130 }}
          onChange={(value) => setPlatform(value)}
          options={PLATFORMS}
          placeholder="电商平台"
        />
        <Select
          value={language}
          style={{ width: 110 }}
          onChange={(value) => setLanguage(value)}
          options={LANGUAGES}
          placeholder="语言"
        />
        <Select
          value={quantity}
          style={{ width: 100 }}
          onChange={(value) => setQuantity(value)}
          options={Array.from({ length: 15 }, (_, i) => ({ value: i + 1, label: `${i + 1}张` }))}
        />
      </div>

      {/* ===== 参考图上传区域（已优化） ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px', flexWrap: 'wrap' }}>
        {/* 显示所有已上传的参考图（按顺序从左到右） */}
        {referenceImages.map((img, idx) => (
          <div key={idx} style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
            <img
              src={img}
              alt={`参考图${idx+1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 4,
                border: '1px solid #e8e8e8',
              }}
            />
            {/* 删除按钮 */}
            <CloseCircleOutlined
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                color: '#ff4d4f',
                cursor: 'pointer',
                fontSize: 16,
                background: '#fff',
                borderRadius: '50%',
              }}
              onClick={() => removeReferenceImage(idx)}
            />
            {/* 序号标签 */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: 10,
                textAlign: 'center',
                padding: '1px 0',
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
              }}
            >
              #{idx + 1}
            </div>
          </div>
        ))}

        {/* 如果未达到8张，显示 "+" 号按钮 */}
        {referenceImages.length < 8 && (
          <div
            style={{
              width: 56,
              height: 56,
              border: '2px dashed #d9d9d9',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.3s',
              flexShrink: 0,
              backgroundColor: '#fafafa',
            }}
            onClick={() => document.getElementById('ref-upload-input')?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1677ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d9d9d9';
            }}
          >
            <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
          </div>
        )}

        {/* 隐藏的文件输入 */}
        <input
          id="ref-upload-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleRefUpload(file);
            }
            e.target.value = '';
          }}
        />

        {/* 计数提示 */}
        <span style={{ color: '#999', fontSize: 13 }}>
          上传参考图 ({referenceImages.length}/8)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '12px' }}>
        {prompts.map((p, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 13, width: 30 }}>#{idx+1}</span>
            <TextArea
              rows={2}
              placeholder={`请输入第 ${idx+1} 张图片的描述`}
              value={p}
              onChange={(e) => updatePrompt(idx, e.target.value)}
              style={{ flex: 1, resize: 'none' }}
            />
          </div>
        ))}
      </div>

      <Button type="primary" onClick={handleGenerateAll} loading={loading} style={{ width: 160 }}>
        一键生成 {prompts.filter(p => p.trim().length > 0).length} 张
      </Button>
      {loading && <Spin tip="生成中，请稍候..." style={{ marginLeft: '12px' }} />}

      {generatedImages.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Divider orientation="left" style={{ margin: '8px 0 16px 0' }}>
            生成结果
          </Divider>
          <Row gutter={[16, 16]}>
            {generatedImages.map((img) => (
              <Col xs={24} sm={12} md={10} lg={6} key={img.id}>
                <Card
                  bordered
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  cover={
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: aspectRatio,
                      overflow: 'hidden',
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <AntImage
                        src={img.url}
                        alt="生成的图片"
                        style={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                        preview={{ mask: '点击预览' }}
                      />
                    </div>
                  }
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteImage(img.id)}
                    />,
                    <Button
                      key="export-psd"
                      type="text"
                      icon={<FilePdfOutlined />}
                      onClick={() => handleExportPSD(img.url)}
                      style={{ whiteSpace: 'nowrap', padding: '0 9px' }} 
                    >
                      导出PSD
                    </Button>,
                  ]}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Tag color="blue">{PLATFORMS.find(p => p.value === img.platform)?.label || img.platform}</Tag>
                      <Tag color="green">{LANGUAGES.find(l => l.value === img.language)?.label || img.language}</Tag>
                      {img.referenceImages && img.referenceImages.length > 0 && <Tag color="orange">参考图 {img.referenceImages.length}张</Tag>}
                    </div>
                    <TextArea
                      rows={2}
                      value={img.prompt}
                      onChange={(e) => {
                        setGeneratedImages(prev =>
                          prev.map(item =>
                            item.id === img.id ? { ...item, prompt: e.target.value } : item
                          )
                        );
                      }}
                      placeholder="修改提示词重新生成"
                      style={{ resize: 'none' }}
                    />
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleRegenerate(img.id, img.prompt)}
                      loading={img.loading}
                      block
                    >
                      {img.loading ? '生成中...' : '重新生成'}
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
      <LoadingProgressModal
        visible={progressVisible}
        title={progressTitle}
      />
    </Card>
  );
}