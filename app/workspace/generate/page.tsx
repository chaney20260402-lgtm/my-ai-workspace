'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Input, Modal, message, Typography, Spin, Layout, Space } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import ImageGenerator from '../components/ImageGenerator';
import { useWorkflow } from '@/app/contexts/WorkflowContext';
import { App } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

// ---------- 工作流数据结构 ----------
interface WorkflowData {
  id: number;
  name: string;
  model: string;
  size: string;
  aspectRatio: string;
  platform: string;
  language: string;
  prompts: string[];
  referenceImages: string[];
  generatedImages: any[];
  createdAt: string;
}

export default function GeneratePage() {
  const { modal } = App.useApp(); // ✅ 获取 modal 实例
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId');

  // ---------- 状态 ----------
  const [workflowName, setWorkflowName] = useState('');
  const [isNew, setIsNew] = useState(!workflowId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ImageGenerator 的所有状态（受控）
  const [model, setModel] = useState('nanobanana-pro');
  const [size, setSize] = useState('2K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [platform, setPlatform] = useState('taobao');
  const [language, setLanguage] = useState('zh');
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const isInitialLoad = useRef(true);

  // ---------- 工作流上下文 ----------
  const { hasUnsavedChanges, setHasUnsavedChanges, registerSaveWorkflow, registerNavigateAfterSave } = useWorkflow();

  // ---------- 命名弹窗函数 ----------
  const showNameInput = (): Promise<string> => {
    return new Promise((resolve) => {
      let inputValue = '';
      modal.confirm({
        title: '为工作流命名',
        content: (
          <Input
            placeholder="请输入工作流名称（如：电商主图生成）"
            onChange={(e) => { inputValue = e.target.value; }}
            autoFocus
          />
        ),
        onOk: () => {
          if (inputValue.trim()) {
            resolve(inputValue.trim());
          } else {
            message.warning('请输入工作流名称');
            return Promise.reject();
          }
        },
        onCancel: () => {
          resolve('');
        },
      });
    });
  };

  // ---------- 加载已有工作流 ----------
  useEffect(() => {
    if (workflowId) {
      setLoading(true);
      fetch(`/api/workflow/${workflowId}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            const wf = result.data;
            setWorkflowName(wf.name);
            setIsNew(false);
            setModel(wf.model || 'nanobanana-pro');
            setSize(wf.size || '2K');
            setAspectRatio(wf.aspectRatio || '1:1');
            setPlatform(wf.platform || 'taobao');
            setLanguage(wf.language || 'zh');
            setPrompts(wf.prompts || ['']);
            setReferenceImages(wf.referenceImages || []);
            setGeneratedImages(wf.generatedImages || []);
          } else {
            message.error(result.error || '加载工作流失败');
            router.push('/workspace/workflow');
          }
        })
        .catch(() => {
          message.error('加载工作流失败');
          router.push('/workspace/workflow');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [workflowId, router]);

  // ---------- 监听状态变化，标记未保存 ----------
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (workflowName || workflowId) {
      setHasUnsavedChanges(true);
    }
  }, [model, size, aspectRatio, platform, language, prompts, referenceImages, generatedImages]);

  // ---------- 保存工作流 ----------
  const handleSave = useCallback(async () => {
    let name = workflowName;
    if (!name.trim()) {
      name = await showNameInput();
      if (!name) {
        return;
      }
      setWorkflowName(name);
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        model,
        size,
        aspectRatio,
        platform,
        language,
        prompts,
        referenceImages,
        generatedImages,
      };

      let url = '/api/workflow';
      let method = 'POST';
      if (!isNew && workflowId) {
        url = `/api/workflow/${workflowId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        message.success(isNew ? '工作流创建成功' : '工作流已更新');
        setHasUnsavedChanges(false);
        if (isNew) {
          // ✅ 新建：跳转到列表页
          router.push('/workspace/workflow');
        }
        // 更新时留在当前页
      } else {
        message.error(result.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [workflowName, isNew, workflowId, model, size, aspectRatio, platform, language, prompts, referenceImages, generatedImages, router, setHasUnsavedChanges]);

  // ✅ 使用 ref 保存最新的 handleSave
  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // ✅ 注册保存函数（只在组件挂载时执行一次）
  useEffect(() => {
    registerSaveWorkflow(async () => {
      await handleSaveRef.current();
    });
    registerNavigateAfterSave(() => {
      router.push('/workspace/workflow');
    });
  }, []); // 空依赖

  // ---------- 浏览器关闭/刷新提醒 ----------
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ---------- 返回列表 ----------
  const handleBack = () => {
    const hasContent = prompts.some(p => p.trim()) || referenceImages.length > 0 || generatedImages.length > 0;

    if (isNew && !hasContent) {
      router.push('/workspace/workflow');
      return;
    }

    if (hasUnsavedChanges) {
      modal.confirm({
        title: '提示',
        content: '您有未保存的更改，是否保存后再离开？',
        okText: '保存并离开',
        cancelText: '不保存直接离开',
        onOk: async () => {
          await handleSave();
          router.push('/workspace/workflow');
        },
        onCancel: () => {
          setHasUnsavedChanges(false);
          router.push('/workspace/workflow');
        },
      });
    } else {
      router.push('/workspace/workflow');
    }
  };

  // ---------- 加载状态 ----------
  if (loading) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Spin tip="加载工作流...">
          <div style={{ minHeight: 80 }} />
        </Spin>
      </div>
    );
  }

  // ---------- UI ----------
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        {/* 顶部工具栏 */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              {workflowName || '未命名工作流'}
            </Title>
          </div>
          <Space size="middle">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              保存工作流
            </Button>
          </Space>
        </div>

        <Content style={{
          padding: '30px',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: '#f5f7fa'
        }}>
          <div style={{ width: '100%', maxWidth: 1500, margin: '0 auto' }}>
            {/* 历史图片预览 */}
            {generatedImages.length > 0 && (
              <div style={{
                marginBottom: 16,
                background: '#fff',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>📸 工作流历史图片</span>
                  <span style={{ color: '#999', fontSize: 12 }}>共 {generatedImages.length} 张</span>
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {generatedImages.map((img, idx) => (
                    <div key={img.id || idx} style={{ flexShrink: 0, position: 'relative' }}>
                      <img
                        src={img.url}
                        alt={`历史图片 ${idx + 1}`}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e8e8' }}
                        onClick={() => { message.info(`提示词: ${img.prompt?.substring(0, 50) || ''}...`); }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 4,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: 10,
                        padding: '0 4px',
                        borderRadius: 4
                      }}>
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 图片生成器组件 */}
            <ImageGenerator
              initialModel={model}
              initialSize={size}
              initialAspectRatio={aspectRatio}
              initialPrompts={prompts}
              initialReferenceImages={referenceImages}
              initialImages={generatedImages}
              onModelChange={setModel}
              onSizeChange={setSize}
              onAspectRatioChange={setAspectRatio}
              onPlatformChange={setPlatform}
              onLanguageChange={setLanguage}
              onPromptsChange={setPrompts}
              onReferenceImagesChange={setReferenceImages}
              onImagesChange={setGeneratedImages}
              onGenerateSuccess={(url) => {
                console.log('图片生成成功:', url);
              }}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}