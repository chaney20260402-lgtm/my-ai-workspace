'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Select, Card, Spin, message } from 'antd';

const { TextArea } = Input;

interface ImageGeneratorProps {
  initialPrompt?: string;
  initialModel?: string;
  initialSize?: string;
  onGenerateSuccess?: (imageUrl: string) => void;
}

export default function ImageGenerator({
  initialPrompt = '',
  initialModel = 'nano-banana',
  initialSize = '2K',
  onGenerateSuccess,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState(initialModel);
  const [size, setSize] = useState(initialSize);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPrompt(initialPrompt);
    setModel(initialModel);
    setSize(initialSize);
  }, [initialPrompt, initialModel, initialSize]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入描述词');
      return;
    }

    setLoading(true);
    setImage(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, size }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setImage(data.imageUrl);
        message.success('生成成功！');
        if (onGenerateSuccess) {
          onGenerateSuccess(data.imageUrl);
        }
      } else {
        message.error(data.error || '生成失败，请重试');
      }
    } catch (error) {
      console.error('生成失败:', error);
      message.error('网络错误，请检查服务器');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 下载图片功能
  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `generated_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ 保存到资产库功能
  const handleSaveToAssets = () => {
    if (!image) return;
    const saved = localStorage.getItem('userAssets');
    const assets = saved ? JSON.parse(saved) : [];
    const newAsset = {
      id: Date.now(),
      name: `生成_${new Date().toLocaleString()}`,
      url: image,
      type: 'image',
    };
    assets.push(newAsset);
    localStorage.setItem('userAssets', JSON.stringify(assets));
    message.success('已保存到资产库');
    if (onGenerateSuccess) onGenerateSuccess(image);
  };

  return (
    <Card title="AI 图像生成器" bordered={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Select
            value={model}
            style={{ width: 200 }}
            onChange={(value) => setModel(value)}
            options={[
              { value: 'nano-banana', label: '🍌 Nano Banana Pro' },
              { value: 'gpt-image-2', label: '🖼️ GPT Image 2' },
            ]}
          />
          <Select
            value={size}
            style={{ width: 120 }}
            onChange={(value) => setSize(value)}
            options={[
              { value: '1K', label: '1K' },
              { value: '2K', label: '2K' },
              { value: '4K', label: '4K' },
            ]}
          />
        </div>
        <TextArea
          rows={4}
          placeholder="请输入您想要的画面描述，例如：一只在花园里读书的猫，油画风格"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button type="primary" onClick={handleGenerate} loading={loading} style={{ width: 120 }}>
          生成图片
        </Button>
        {loading && <Spin tip="生成中，请稍候..." />}
        {image && (
          <div style={{ marginTop: '20px' }}>
            <img src={image} alt="生成的图片" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
              <Button onClick={handleDownload}>⬇️ 下载图片</Button>
              <Button onClick={handleSaveToAssets}>📁 保存到资产库</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}