'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Input, Select, Card, Spin, message, Layout, Typography, Space, Avatar, Divider, Menu } from 'antd';
import { 
  HomeOutlined, 
  PictureOutlined, 
  FileImageOutlined, 
  HistoryOutlined, 
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import ImageGenerator from '../components/ImageGenerator';
import { addNotification } from '@/lib/notifications';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

// 定义工作流类型（与 workflow 页面一致）
interface Workflow {
  id: number;
  name: string;
  model: string;
  size: string;
  aspectRatio: string;
  prompt: string;
  createdAt: string;
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('workflowId');
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(150);
  const [selectedModel, setSelectedModel] = useState('nano-banana');
  const [selectedSize, setSelectedSize] = useState('2K');
  const [selectedRatio, setSelectedRatio] = useState('1:1');

  // 加载工作流数据（如果是编辑已有工作流）
  useEffect(() => {
    if (workflowId) {
      const saved = localStorage.getItem('workflows');
      if (saved) {
        const workflows: Workflow[] = JSON.parse(saved);
        const found = workflows.find((w) => w.id === parseInt(workflowId));
        if (found) {
          setWorkflow(found);
          setSelectedModel(found.model === 'Nano Banana Pro' ? 'nano-banana' : 'gpt-image-2');
          setSelectedSize(found.size);
          setSelectedRatio(found.aspectRatio);
        }
      }
    }
    setLoading(false);
  }, [workflowId]);

  // 加载积分
  useEffect(() => {
    const saved = localStorage.getItem('userCredits');
    if (saved) setCredits(parseInt(saved));
  }, []);

  // 运行工作流（生成图片）
  const handleRun = () => {
    if (!workflow) {
      // 如果是新建工作流，创建一个临时工作流并运行
      const newWorkflow: Workflow = {
        id: Date.now(),
        name: '未命名工作流',
        model: selectedModel === 'nano-banana' ? 'Nano Banana Pro' : 'GPT Image 2',
        size: selectedSize,
        aspectRatio: selectedRatio,
        prompt: '',
        createdAt: new Date().toISOString(),
      };
      // 保存到 localStorage
      const saved = localStorage.getItem('workflows');
      const workflows = saved ? JSON.parse(saved) : [];
      workflows.push(newWorkflow);
      localStorage.setItem('workflows', JSON.stringify(workflows));
      setWorkflow(newWorkflow);
      message.success('工作流已创建，请填写提示词');
    } else {
      // 更新现有工作流（可选）
      message.info('运行工作流，开始生成图片');
    }
  };

  // 左侧菜单项
  const menuItems = [
    { key: 'text2img', icon: <PictureOutlined />, label: '文字生图' },
    { key: 'img2img', icon: <FileImageOutlined />, label: '图生图' },
    { key: 'history', icon: <HistoryOutlined />, label: '历史记录' },
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
  ];

  if (loading) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧工具栏 */}
      <Sider width={80} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1677ff', marginBottom: 24 }}>🎨</div>
          <Menu
            mode="inline"
            defaultSelectedKeys={['text2img']}
            style={{ borderRight: 0 }}
            items={menuItems}
          />
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout>
        {/* 顶部栏 */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {workflow?.name || '未命名工作流'}
            </Title>
          </div>
          <Space size="middle">
            <span style={{ fontWeight: 'bold' }}>💰 {credits}</span>
            <Select
              value={selectedModel}
              style={{ width: 140 }}
              onChange={(value) => setSelectedModel(value)}
              options={[
                { value: 'nano-banana', label: 'Nano Banana' },
                { value: 'gpt-image-2', label: 'GPT Image 2' },
              ]}
            />
            <Select
              value={selectedSize}
              style={{ width: 100 }}
              onChange={(value) => setSelectedSize(value)}
              options={[
                { value: '1K', label: '1K' },
                { value: '2K', label: '2K' },
                { value: '4K', label: '4K' },
              ]}
            />
            <Select
              value={selectedRatio}
              style={{ width: 100 }}
              onChange={(value) => setSelectedRatio(value)}
              options={[
                { value: '16:9', label: '16:9' },
                { value: '4:3', label: '4:3' },
                { value: '1:1', label: '1:1' },
                { value: '3:4', label: '3:4' },
                { value: '9:16', label: '9:16' },
              ]}
            />
            <Button type="primary" onClick={handleRun}>
              运行
            </Button>
          </Space>
        </div>

        {/* 内容区（ImageGenerator） */}
        <Content style={{ padding: '24px', background: '#f5f7fa' }}>
          <ImageGenerator
            initialPrompt={workflow?.prompt || ''}
            initialModel={selectedModel}
            initialSize={selectedSize}
            initialAspectRatio={selectedRatio}
            onGenerateSuccess={(imageUrl) => {
              // 生成成功后自动保存到资产库（已有逻辑）
              const saved = localStorage.getItem('userAssets');
              const assets = saved ? JSON.parse(saved) : [];
              const newAsset = {
                id: Date.now(),
                name: `生成_${new Date().toLocaleString()}`,
                url: imageUrl,
                type: 'image',
              };
              assets.push(newAsset);
              localStorage.setItem('userAssets', JSON.stringify(assets));
              message.success('图片已保存到资产库');
            }}
          />
        </Content>

        {/* 🐱 皮卡丘奔跑动画占位（功能3暂留） */}
        <div style={{ 
          height: 60, 
          background: '#f0f8ff', 
          borderTop: '1px solid #e6e6e6',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{ 
            animation: 'run 8s linear infinite',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 32 }}>⚡️</span>
            <span style={{ fontSize: 28 }}>🐣</span>
            <span style={{ fontSize: 20 }}>皮卡丘正在奔跑...</span>
          </div>
          <style>{`
            @keyframes run {
              0% { transform: translateX(-200px); }
              100% { transform: translateX(calc(100vw - 200px)); }
            }
          `}</style>
        </div>
      </Layout>
    </Layout>
  );
}