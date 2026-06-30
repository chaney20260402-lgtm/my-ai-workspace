'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Input, Select, Card, Spin, message, Layout, Typography, Space, Divider, Dropdown, Menu, Upload, Image } from 'antd';
import {
  PictureOutlined,
  FileImageOutlined,
  HistoryOutlined,
  SettingOutlined,
  ToolOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import ImageGenerator from '../components/ImageGenerator';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

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
  const [quantity, setQuantity] = useState(1);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const [mode, setMode] = useState<'text' | 'image'>('text');

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgGenerating, setImgGenerating] = useState(false);

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

  useEffect(() => {
    const saved = localStorage.getItem('userCredits');
    if (saved) setCredits(parseInt(saved));
  }, []);

  const saveWorkflowName = (newName: string) => {
    if (!workflow) {
      const newWorkflow: Workflow = {
        id: Date.now(),
        name: newName.trim() || '未命名工作流',
        model: selectedModel === 'nano-banana' ? 'Nano Banana Pro' : 'GPT Image 2',
        size: selectedSize,
        aspectRatio: selectedRatio,
        prompt: '',
        createdAt: new Date().toISOString(),
      };
      const saved = localStorage.getItem('workflows');
      const workflows = saved ? JSON.parse(saved) : [];
      workflows.push(newWorkflow);
      localStorage.setItem('workflows', JSON.stringify(workflows));
      setWorkflow(newWorkflow);
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

  const handleRun = () => {
    if (!workflow) {
      const newWorkflow: Workflow = {
        id: Date.now(),
        name: '未命名工作流',
        model: selectedModel === 'nano-banana' ? 'Nano Banana Pro' : 'GPT Image 2',
        size: selectedSize,
        aspectRatio: selectedRatio,
        prompt: '',
        createdAt: new Date().toISOString(),
      };
      const saved = localStorage.getItem('workflows');
      const workflows = saved ? JSON.parse(saved) : [];
      workflows.push(newWorkflow);
      localStorage.setItem('workflows', JSON.stringify(workflows));
      setWorkflow(newWorkflow);
      message.success('工作流已创建，请填写提示词');
    } else {
      message.info('运行工作流，开始生成图片');
    }
  };

  const handleImageGenerate = async () => {
    if (!uploadedImage) {
      message.warning('请先上传一张图片');
      return;
    }
    if (!imgPrompt.trim()) {
      message.warning('请输入提示词');
      return;
    }

    setImgGenerating(true);
    try {
      const count = quantity;
      const generatedUrls: string[] = [];

      for (let i = 0; i < count; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockUrl = `https://picsum.photos/seed/img${Date.now() + i}/400/300`;
        generatedUrls.push(mockUrl);
      }

      message.success(`成功生成 ${generatedUrls.length} 张图片`);

      const saved = localStorage.getItem('userAssets');
      const assets = saved ? JSON.parse(saved) : [];
      generatedUrls.forEach((url) => {
        assets.push({
          id: Date.now() + Math.random(),
          name: `图生图_${new Date().toLocaleString()}`,
          url,
          type: 'image',
        });
      });
      localStorage.setItem('userAssets', JSON.stringify(assets));
    } catch (error) {
      console.error('生成失败:', error);
      message.error('生成失败，请重试');
    } finally {
      setImgGenerating(false);
    }
  };

  const toolMenu = (
    <Menu
      onClick={({ key }) => {
        if (key === 'text2img') {
          setMode('text');
          message.info('切换到文字生图模式');
        } else if (key === 'img2img') {
          setMode('image');
          message.info('切换到图片生图模式');
        } else {
          message.info(`${key} 功能开发中`);
        }
      }}
    >
      <Menu.Item key="text2img" icon={<PictureOutlined />}>
        文本生图
      </Menu.Item>
      <Menu.Item key="img2img" icon={<FileImageOutlined />}>
        图生图
      </Menu.Item>
      <Menu.Item key="history" icon={<HistoryOutlined />}>
        历史记录
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        设置
      </Menu.Item>
    </Menu>
  );

  if (loading) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isEditingName ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={() => {
                  if (editedName.trim()) {
                    saveWorkflowName(editedName.trim());
                  }
                  setIsEditingName(false);
                }}
                onPressEnter={() => {
                  if (editedName.trim()) {
                    saveWorkflowName(editedName.trim());
                  }
                  setIsEditingName(false);
                }}
                autoFocus
                style={{ fontSize: 18, fontWeight: 'bold', width: 200 }}
              />
            ) : (
              <Title
                level={4}
                style={{ margin: 0, cursor: 'pointer' }}
                onClick={() => {
                  setEditedName(workflow?.name || '未命名工作流');
                  setIsEditingName(true);
                }}
              >
                {workflow?.name || '未命名工作流'}
              </Title>
            )}
            <span style={{ color: '#bfbfbf', marginLeft: 8 }}>
              {mode === 'text' ? '📝 文字生图' : '🖼️ 图生图'}
            </span>
          </div>
          <Space size="middle">
            <Button type="primary" onClick={handleRun}>
              运行
            </Button>
            <Dropdown overlay={toolMenu} trigger={['hover']} placement="bottomRight">
              <Button icon={<ToolOutlined />}>作图</Button>
            </Dropdown>
          </Space>
        </div>

        <Content
          style={{
            padding: '30px',
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            background: '#f5f7fa',
          }}
        >
          <div style={{ width: '100%', maxWidth: 1500, margin: '0 auto' }}>
            {mode === 'text' ? (
              <div style={{ width: '100%' }}>
                <ImageGenerator
                  initialPrompt={workflow?.prompt || ''}
                  initialModel={selectedModel}
                  initialSize={selectedSize}
                  initialAspectRatio={selectedRatio}
                  onGenerateSuccess={(imageUrl) => {
                    console.log('✅ 生成成功，图片URL长度:', imageUrl.length);
                  }}
                />
              </div>
            ) : (
              <Card
                title="🖼️ 图片生图"
                bordered={false}
                style={{
                  maxWidth: 600,
                  width: '100%',
                  minHeight: 380,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                bodyStyle={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: 12,
                    }}
                  >
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
                    <Select
                      value={quantity}
                      style={{ width: 80 }}
                      onChange={(value) => setQuantity(value)}
                      options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}张` }))}
                    />
                  </div>

                  <div>
                    {uploadedImage ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <Image
                          src={uploadedImage}
                          alt="上传的图片"
                          style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }}
                          preview
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          style={{ position: 'absolute', top: 8, right: 8 }}
                          onClick={() => setUploadedImage(null)}
                        />
                      </div>
                    ) : (
                      <Upload
                        accept="image/*"
                        beforeUpload={(file) => {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setUploadedImage(e.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                          return false;
                        }}
                        showUploadList={false}
                      >
                        <Button icon={<UploadOutlined />} block size="large">
                          点击上传图片
                        </Button>
                      </Upload>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      支持 JPG, PNG, WebP 格式
                    </Text>
                  </div>

                  <TextArea
                    rows={2}
                    placeholder="请输入您想要的画面描述，例如：将图片中的猫变成狗，保持背景不变"
                    value={imgPrompt}
                    onChange={(e) => setImgPrompt(e.target.value)}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleImageGenerate}
                      loading={imgGenerating}
                      disabled={!uploadedImage}
                      style={{
                        backgroundColor: '#000',
                        borderColor: '#000',
                        color: '#fff',
                        minWidth: 120,
                      }}
                    >
                      生成图片
                    </Button>
                  </div>
                  {imgGenerating && <Spin tip="生成中，请稍候..." />}
                </div>
              </Card>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}