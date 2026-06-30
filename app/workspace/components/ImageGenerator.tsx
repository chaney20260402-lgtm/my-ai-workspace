'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Select, Card, Spin, message, Row, Col, Divider, Image as AntImage } from 'antd';
import { DeleteOutlined, FilePdfOutlined } from '@ant-design/icons';
import JSZip from 'jszip';
import { useCredits } from '@/app/contexts/CreditsContext';  // ← 导入积分 Hook

const { TextArea } = Input;

interface ImageGeneratorProps {
  initialPrompt?: string;
  initialModel?: string;
  initialSize?: string;
  initialAspectRatio?: string;
  onGenerateSuccess?: (imageUrl: string) => void;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  loading: boolean;
}

const modelOptions = [
  { value: 'nanobanana-pro', label: '🍌 Nano Banana Pro' },
  { value: 'nanobanana-2', label: '🍌 Nano Banana 2' },
  { value: 'gpt-image-2', label: '🖼️ GPT Image 2' },
  { value: 'seedream-5.0-lite', label: '✨ Seedream 5.0 Lite' },
  { value: 'seedream-4.5', label: '✨ Seedream 4.5' },
  { value: 'seedream-4.0', label: '✨ Seedream 4.0' },
  { value: 'wan-2.7', label: '🌊 Wan 2.7' },
  { value: 'wan-2.7-pro', label: '🌊 Wan 2.7 Pro' },
  { value: 'wan-2.6', label: '🌊 Wan 2.6' },
  { value: 'qwen-edit-max', label: '✏️ Qwen Edit Max' },
  { value: 'midjourney-v8.1', label: '🎨 MidJourney V8.1' },
  { value: 'midjourney-niji', label: '🎨 MidJourney Niji' },
];

export default function ImageGenerator({
  initialPrompt = '',
  initialModel = 'nanobanana-pro',
  initialSize = '2K',
  initialAspectRatio = '1:1',
  onGenerateSuccess,
}: ImageGeneratorProps) {
  const { setCredits } = useCredits();  // ← 获取更新积分的方法

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

  // ---------- 生成图片 ----------
  const handleGenerate = async () => {
    console.log('🔵 生成按钮被点击');
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

        // ❌ 处理积分不足等错误
        if (!response.ok) {
          if (response.status === 402) {
            message.error(data.error || '积分不足，请充值');
          } else {
            message.error(`第 ${i+1} 张生成失败: ${data.error || '未知错误'}`);
          }
          continue;  // 跳过这张，继续下一张
        }

        // ✅ 生成成功
        if (data.success && data.imageUrl) {
          // 更新全局积分（从 API 返回）
          if (data.credits !== undefined) {
            setCredits(data.credits);
          }

          // 显示剩余积分通知（铃铛）
          message.success(`✅ 生成成功，剩余积分：${data.credits ?? '未知'}`);

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

  // ---------- 重新生成 ----------
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

      if (!response.ok) {
        if (response.status === 402) {
          message.error(data.error || '积分不足，请充值');
        } else {
          message.error('重新生成失败: ' + (data.error || '未知错误'));
        }
        setGeneratedImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, loading: false } : img
          )
        );
        return;
      }

      if (data.success && data.imageUrl) {
        // 更新积分
        if (data.credits !== undefined) {
          setCredits(data.credits);
        }
        message.success(`✅ 重新生成成功，剩余积分：${data.credits ?? '未知'}`);

        setGeneratedImages((prev) =>
          prev.map((img) =>
            img.id === imageId
              ? { ...img, url: data.imageUrl, prompt: newPrompt, loading: false }
              : img
          )
        );
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

  // ---------- 删除图片 ----------
  const handleDeleteImage = (id: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // ========== 辅助：将 base64 或 data URL 转为 Blob ==========
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

  // ========== 导出为 ZIP 包（PSD图层） ==========
  const handleExportPSD = async (imageUrl: string) => {
    let hideLoading: any = null;
    try {
      hideLoading = message.loading('正在分析图层...', 0);
      const res = await fetch('/api/layer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      hideLoading();

      if (!data.success) {
        // 处理积分不足等错误
        if (res.status === 402) {
          message.error(data.error || '积分不足，无法导出图层');
        } else {
          throw new Error(data.error || '分层失败');
        }
        return;
      }

      // ✅ 更新积分（如果 layer API 返回了 credits）
      if (data.credits !== undefined) {
        setCredits(data.credits);
        message.success(`✅ 图层导出成功，剩余积分：${data.credits}`);
      }

      hideLoading = message.loading('正在打包图层...', 0);

      const zip = new JSZip();

      for (let i = 0; i < data.layers.length; i++) {
        const layer = data.layers[i];
        if (!layer.data) {
          console.warn(`图层 ${layer.name} 无数据，跳过`);
          continue;
        }
        const blob = dataURLToBlob(layer.data);
        const fileName = `图层${i+1}_${layer.name}.png`;
        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      if (zipBlob.size === 0) {
        throw new Error('生成的 ZIP 为空，可能没有有效图层');
      }

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `layers_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      hideLoading();
      message.success('图层打包下载成功！');
    } catch (error) {
      if (hideLoading) hideLoading();
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };

  // ========== UI 渲染 ==========
  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600 }}>文字生图</span>}
      bordered={false}
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
      {/* 控制栏 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '27px', marginBottom: '16px' }}>
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
          value={quantity}
          style={{ width: 100 }}
          onChange={(value) => setQuantity(value)}
          options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}张` }))}
        />
      </div>

      {/* 提示词输入 */}
      <TextArea
        rows={3}
        placeholder="请输入您想要的画面描述，例如：一只在花园里读书的猫，油画风格"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ marginBottom: '12px' }}
      />

      {/* 生成按钮 */}
      <Button type="primary" onClick={handleGenerate} loading={loading} style={{ width: 120 }}>
        生成图片
      </Button>
      {loading && <Spin tip="生成中，请稍候..." style={{ marginLeft: '12px' }} />}

      {/* 生成结果 */}
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
                    <TextArea
                      rows={2}
                      value={img.prompt}
                      onChange={(e) => {
                        setGeneratedImages((prev) =>
                          prev.map((item) =>
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
    </Card>
  );
}