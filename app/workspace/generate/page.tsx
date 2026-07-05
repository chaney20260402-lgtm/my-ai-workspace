'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Input, Select, Spin, message, Layout, Typography, Space, Dropdown, Menu } from 'antd';
import { HistoryOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons';
import ImageGenerator from '../components/ImageGenerator';

const { Content } = Layout;
const { Title } = Typography;

interface Workflow {
  id: number;
  name: string;
  model: string;
  size: string;
  aspectRatio: string;
  prompt: string;
  createdAt: string;
  generatedImages?: any[];
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('workflowId');

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('nanobanana-pro');
  const [selectedSize, setSelectedSize] = useState('2K');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [workflowImages, setWorkflowImages] = useState<any[]>([]);

  useEffect(() => {
    if (workflowId) {
      const saved = localStorage.getItem('workflows');
      if (saved) {
        const workflows: Workflow[] = JSON.parse(saved);
        const found = workflows.find((w) => w.id === parseInt(workflowId));
        if (found) {
          setWorkflow(found);
          setSelectedModel(found.model === 'Nano Banana Pro' ? 'nanobanana-pro' : 'gpt-image-2');
          setSelectedSize(found.size);
          setSelectedRatio(found.aspectRatio);
          if (found.generatedImages) setWorkflowImages(found.generatedImages);
        }
      }
    }
    setLoading(false);
  }, [workflowId]);

  const saveWorkflowName = (newName: string) => {
    if (!workflow) {
      const newWorkflow: Workflow = {
        id: Date.now(),
        name: newName.trim() || '未命名工作流',
        model: selectedModel === 'nanobanana-pro' ? 'Nano Banana Pro' : 'GPT Image 2',
        size: selectedSize,
        aspectRatio: selectedRatio,
        prompt: '',
        createdAt: new Date().toISOString(),
        generatedImages: [],
      };
      const saved = localStorage.getItem('workflows');
      const workflows = saved ? JSON.parse(saved) : [];
      workflows.push(newWorkflow);
      localStorage.setItem('workflows', JSON.stringify(workflows));
      setWorkflow(newWorkflow);
      setWorkflowImages([]);
      message.success('工作流已创建');
      return;
    }

    const updatedWorkflow = { ...workflow, name: newName };
    setWorkflow(updatedWorkflow);

    const saved = localStorage.getItem('workflows');
    if (saved) {
      const workflows: Workflow[] = JSON.parse(saved);
      const index = workflows.findIndex((w) => w.id === workflow.id);
      if (index !== -1) {
        workflows[index].name = newName;
        localStorage.setItem('workflows', JSON.stringify(workflows));
      }
    }
  };

  const updateWorkflowPrompt = (prompt: string) => {
    if (!workflow) return;
    const updatedWorkflow = { ...workflow, prompt };
    setWorkflow(updatedWorkflow);

    const saved = localStorage.getItem('workflows');
    if (saved) {
      const workflows: Workflow[] = JSON.parse(saved);
      const index = workflows.findIndex((w) => w.id === workflow.id);
      if (index !== -1) {
        workflows[index].prompt = prompt;
        localStorage.setItem('workflows', JSON.stringify(workflows));
      }
    }
  };

  const updateWorkflowImages = (images: any[]) => {
    setWorkflowImages(images);
    if (!workflow) return;
    const updatedWorkflow = { ...workflow, generatedImages: images };
    setWorkflow(updatedWorkflow);

    const saved = localStorage.getItem('workflows');
    if (saved) {
      const workflows: Workflow[] = JSON.parse(saved);
      const index = workflows.findIndex((w) => w.id === workflow.id);
      if (index !== -1) {
        workflows[index].generatedImages = images;
        localStorage.setItem('workflows', JSON.stringify(workflows));
      }
    }
  };

  const toolMenu = (
    <Menu
      onClick={({ key }) => {
        if (key === 'history') router.push('/workspace/workflow');
        else if (key === 'settings') message.info('设置功能开发中');
        else message.info(`${key} 功能开发中`);
      }}
    >
      <Menu.Item key="history" icon={<HistoryOutlined />}>工作流列表</Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>设置</Menu.Item>
    </Menu>
  );

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        {/* 顶部工具栏 */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isEditingName ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={() => { if (editedName.trim()) saveWorkflowName(editedName.trim()); setIsEditingName(false); }}
                onPressEnter={() => { if (editedName.trim()) saveWorkflowName(editedName.trim()); setIsEditingName(false); }}
                autoFocus
                style={{ fontSize: 18, fontWeight: 'bold', width: 200 }}
              />
            ) : (
              <Title level={4} style={{ margin: 0, cursor: 'pointer' }} onClick={() => { setEditedName(workflow?.name || '未命名工作流'); setIsEditingName(true); }}>
                {workflow?.name || '未命名工作流'}
              </Title>
            )}
            {/* 已移除 "📝 文字生图" 标签 */}
          </div>
          <Space size="middle">
            {/* 已移除 "运行" 按钮 */}
            <Dropdown overlay={toolMenu} trigger={['hover']} placement="bottomRight">
              <Button icon={<ToolOutlined />}>菜单</Button>
            </Dropdown>
          </Space>
        </div>

        <Content style={{ padding: '30px', minHeight: 'calc(100vh - 64px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: '#f5f7fa' }}>
          <div style={{ width: '100%', maxWidth: 1500, margin: '0 auto' }}>
            {workflowImages.length > 0 && (
              <div style={{ marginBottom: 16, background: '#fff', padding: '12px 16px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>📸 工作流历史图片</span>
                  <span style={{ color: '#999', fontSize: 12 }}>共 {workflowImages.length} 张</span>
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {workflowImages.map((img, idx) => (
                    <div key={img.id} style={{ flexShrink: 0, position: 'relative' }}>
                      <img
                        src={img.url}
                        alt={`历史图片 ${idx+1}`}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e8e8' }}
                        onClick={() => { message.info(`提示词: ${img.prompt.substring(0, 50)}...`); }}
                      />
                      <div style={{ position: 'absolute', bottom: 2, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '0 4px', borderRadius: 4 }}>
                        #{idx+1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ImageGenerator
              initialPrompt={workflow?.prompt || ''}
              initialModel={selectedModel}
              initialSize={selectedSize}
              initialAspectRatio={selectedRatio}
              initialImages={workflowImages}
              onPromptChange={(prompt) => { if (workflow && prompt) updateWorkflowPrompt(prompt); }}
              onImagesChange={(images) => updateWorkflowImages(images)}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}