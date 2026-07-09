'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Input, Modal, message, Typography, Spin, Layout, Space, Dropdown, Menu } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, ToolOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons';
import ImageGenerator from '../components/ImageGenerator';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ---------- 命名弹窗 ----------
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState('');

  // ---------- 加载已有工作流 ----------
  useEffect(() => {
    if (workflowId) {
      setLoading(true);
      try {
        const saved = localStorage.getItem('workflows');
        if (saved) {
          const workflows: WorkflowData[] = JSON.parse(saved);
          const found = workflows.find(w => w.id === Number(workflowId));
          if (found) {
            setWorkflowName(found.name);
            setIsNew(false);
            setModel(found.model || 'nanobanana-pro');
            setSize(found.size || '2K');
            setAspectRatio(found.aspectRatio || '1:1');
            setPlatform(found.platform || 'taobao');
            setLanguage(found.language || 'zh');
            setPrompts(found.prompts || ['']);
            setReferenceImages(found.referenceImages || []);
            setGeneratedImages(found.generatedImages || []);
          } else {
            message.error('工作流不存在');
            router.push('/workspace/workflows');
          }
        } else {
          message.error('工作流不存在');
          router.push('/workspace/workflows');
        }
      } catch (error) {
        console.error('加载工作流失败:', error);
        message.error('加载工作流失败');
        router.push('/workspace/workflows');
      } finally {
        setLoading(false);
      }
    } else {
      // 新建工作流：弹出命名弹窗
      setNameModalVisible(true);
      setLoading(false);
    }
  }, [workflowId, router]);
  // ✅ 新增：监听状态变化，标记有未保存的更改
useEffect(() => {
  // 只有当工作流已加载（有名称）时才标记
  if (workflowName || workflowId) {
    setHasUnsavedChanges(true);
  }
}, [model, size, aspectRatio, platform, language, prompts, referenceImages, generatedImages, workflowName]);

  // ---------- 保存工作流 ----------
  const handleSave = useCallback(async () => {
  console.log('保存按钮被点击');  // 调试
  console.log('当前 workflowName:', workflowName);  // 调试

  if (!workflowName.trim()) {
    console.log('workflowName 为空，显示警告');
    message.warning('请先命名工作流');
    return;
  }

  setSaving(true);
  try {
    console.log('开始保存...');
    const saved = localStorage.getItem('workflows');
    let workflows: WorkflowData[] = saved ? JSON.parse(saved) : [];

    const newWorkflow: WorkflowData = {
      id: isNew ? Date.now() : Number(workflowId),
      name: workflowName.trim(),
      model,
      size,
      aspectRatio,
      platform,
      language,
      prompts,
      referenceImages,
      generatedImages,
      createdAt: isNew ? new Date().toISOString() : workflows.find(w => w.id === Number(workflowId))?.createdAt || new Date().toISOString(),
    };

    if (isNew) {
      workflows.unshift(newWorkflow);
    } else {
      const index = workflows.findIndex(w => w.id === Number(workflowId));
      if (index !== -1) {
        workflows[index] = newWorkflow;
      } else {
        workflows.unshift(newWorkflow);
      }
    }

    localStorage.setItem('workflows', JSON.stringify(workflows));
    console.log('保存成功，数据：', workflows);  // 调试

    if (isNew) {
      message.success('工作流创建并保存成功');
      // ✅ 添加这一行
    setHasUnsavedChanges(false);
      router.replace(`/workspace/generate?workflowId=${newWorkflow.id}`);
      setIsNew(false);
    } else {
      message.success('工作流已更新');
      setHasUnsavedChanges(false);
    }
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请重试');
  } finally {
    setSaving(false);
  }
}, [workflowName, isNew, workflowId, model, size, aspectRatio, platform, language, prompts, referenceImages, generatedImages, router]);
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

  // ---------- 确认命名 ----------
  const handleNameConfirm = () => {
    if (!tempName.trim()) {
      message.warning('请输入工作流名称');
      return;
    }
    setWorkflowName(tempName.trim());
    setNameModalVisible(false);
    // 保存按钮会后续触发

  };

  // ---------- 返回列表 ----------
  const handleBack = () => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: '提示',
        content: '您有未保存的更改，是否保存后再离开？',
        okText: '保存并离开',
        cancelText: '不保存直接离开',
        onOk: async () => {
          await handleSave();
          router.push('/workspace/workflows');
        },
        onCancel: () => {
          setHasUnsavedChanges(false);
          router.push('/workspace/workflows');
        },
      });
    } else {
      router.push('/workspace/workflows');
    }
  };

  // ---------- 工具菜单 ----------
  const toolMenu = (
    <Menu
      onClick={({ key }) => {
        if (key === 'history') router.push('/workspace/workflows');
        else if (key === 'settings') message.info('设置功能开发中');
        else message.info(`${key} 功能开发中`);
      }}
    >
      <Menu.Item key="history" icon={<HistoryOutlined />}>工作流列表</Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>设置</Menu.Item>
    </Menu>
  );

  // ---------- 加载状态 ----------
  if (loading) {
  return (
    <div style={{ padding: 50, textAlign: 'center' }}>
      <Spin tip="加载工作流...">
        <div style={{ minHeight: 80 }} />  {/* 占位内容 */}
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
            <Dropdown overlay={toolMenu} trigger={['hover']} placement="bottomRight">
              <Button icon={<ToolOutlined />}>菜单</Button>
            </Dropdown>
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
                        alt={`历史图片 ${idx+1}`}
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
                        #{idx+1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 图片生成器组件（受控） */}
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
                // 图片生成成功时的额外处理（可选）
                console.log('图片生成成功:', url);
              }}
            />
          </div>
        </Content>
      </Layout>

      {/* 命名弹窗 */}
      <Modal
        title="为工作流命名"
        open={nameModalVisible}
        onOk={handleNameConfirm}
        onCancel={() => {
          // 如果取消，返回列表
          router.push('/workspace/workflows');
        }}
        closable={false}
        maskClosable={false}
      >
        <Input
          placeholder="请输入工作流名称（如：电商主图生成）"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onPressEnter={handleNameConfirm}
          autoFocus
        />
        <div style={{ marginTop: 8, color: '#999', fontSize: 13 }}>
          命名后，您的工作流将被保存到列表中
        </div>
      </Modal>
    </Layout>
  );
}