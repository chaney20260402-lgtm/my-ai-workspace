'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Select, Card, Spin, message, Row, Col, Space, Divider, Image } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ImageGeneratorProps {
  initialPrompt?: string;
  initialModel?: string;
  initialSize?: string;
  initialAspectRatio?: string;
  onGenerateSuccess?: (imageUrl: string) => void;
}

// 生成结果项
interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  loading: boolean;
}

export default function ImageGenerator({
  initialPrompt = '',
  initialModel = 'nano-banana',
  initialSize = '2K',
  initialAspectRatio = '1:1',
  onGenerateSuccess,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState(initialModel);
  const [size, setSize] = useState(initialSize);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    setPrompt(initialPrompt);
    setModel(initialModel);
    setSize(initialSize);
    setAspectRatio(initialAspectRatio);
  }, [initialPrompt, initialModel, initialSize, initialAspectRatio]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入描述词');
      return;
    }

    setLoading(true);
    const count = quantity;

    try {
      const newImages: GeneratedImage[] = [];
      for (let i = 0; i < count; i++) {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model, size, aspectRatio }),
        });

        const data = await response.json();
        if (data.success && data.imageUrl) {
          newImages.push({
            id: `${Date.now()}-${i}`,
            url: data.imageUrl,
            prompt: prompt,
            loading: false,
          });
          if (onGenerateSuccess) {
            onGenerateSuccess(data.imageUrl);
          }
        } else {
          message.error(`第 ${i+1} 张生成失败: ${data.error || '未知错误'}`);
        }
      }
      setGeneratedImages((prev) => [...prev, ...newImages]);
      if (newImages.length > 0) {
        message.success(`成功生成 ${newImages.length} 张图片`);
      }
    } catch (error) {
      console.error('生成失败:', error);
      message.error('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (imageId: string, newPrompt: string) => {
    if (!newPrompt.trim()) {
      message.warning('请输入描述词');
      return;
    }

    setGeneratedImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, loading: true } : img
      )
    );

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newPrompt, model, size, aspectRatio }),
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        setGeneratedImages((prev) =>
          prev.map((img) =>
            img.id === imageId
              ? { ...img, url: data.imageUrl, prompt: newPrompt, loading: false }
              : img
          )
        );
        message.success('图片重新生成成功');
        if (onGenerateSuccess) {
          onGenerateSuccess(data.imageUrl);
        }
      } else {
        message.error('重新生成失败: ' + (data.error || '未知错误'));
        setGeneratedImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, loading: false } : img
          )
        );
      }
    } catch (error) {
      console.error('重新生成失败:', error);
      message.error('重新生成失败');
      setGeneratedImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, loading: false } : img
        )
      );
    }
  };

  const handleDeleteImage = (id: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <span>AI 图像生成器</span>
          <Select
            value={model}
            style={{ width: 140 }}
            onChange={(value) => setModel(value)}
            options={[
              { value: 'nano-banana', label: 'Nano Banana' },
              { value: 'gpt-image-2', label: 'GPT Image 2' },
            ]}
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
            value={quantity}
            style={{ width: 80 }}
            onChange={(value) => setQuantity(value)}
            options={[1,2,3,4,5].map(n => ({ value: n, label: `${n}张` }))}
          />
        </div>
      }
      bordered={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        {/* 锚点区域（主卡片底部） */}
        {generatedImages.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid #e8e8e8', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {Array.from({ length: quantity }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#1677ff', border: '2px solid white', boxShadow: '0 0 0 1px #1677ff' }} />
                  <span style={{ fontSize: 10, marginTop: 2, color: '#1677ff' }}>{`${idx+1}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 生成结果卡片列表 */}
        {generatedImages.length > 0 && (
          <div style={{ marginTop: 20 }}>
            {/* 连接线区域：竖线 + 圆点 */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 8 }}>
              {Array.from({ length: quantity }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 2, height: 30, background: '#1677ff' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#1677ff', border: '2px solid white' }} />
                  <span style={{ fontSize: 10, marginTop: 2, color: '#1677ff' }}>{`${idx+1}`}</span>
                </div>
              ))}
            </div>
            <Divider orientation="left" style={{ margin: '8px 0' }}>生成结果</Divider>
            <Row gutter={[16, 16]}>
              {generatedImages.map((img) => (
                <Col xs={24} sm={12} md={8} lg={6} key={img.id}>
                  <Card
                    cover={
                      <Image
                        src={img.url}
                        alt="生成的图片"
                        style={{ width: '100%', height: 200, objectFit: 'cover' }}
                        preview={{ mask: '点击预览' }}
                      />
                    }
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteImage(img.id)}
                      />,
                    ]}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <TextArea
                        rows={3}
                        value={img.prompt}
                        onChange={(e) => {
                          setGeneratedImages((prev) =>
                            prev.map((item) =>
                              item.id === img.id ? { ...item, prompt: e.target.value } : item
                            )
                          );
                        }}
                        placeholder="修改提示词重新生成"
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
      </div>
    </Card>
  );
}