'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Form, Select, Modal, List, message, Typography, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, PlayCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title } = Typography;
const { TextArea } = Input;

// 定义工作流类型
interface Workflow {
  id: number;
  name: string;
  model: string;
  size: string;          // 1K, 2K, 4K
  aspectRatio: string;   // 新增：16:9, 4:3, 1:1, 3:4, 9:16
  prompt: string;
  createdAt: string;
}

export default function WorkflowPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const saved = localStorage.getItem('workflows');
    if (saved) {
      setWorkflows(JSON.parse(saved));
    }
  }, []);

  const handleCreate = (values: any) => {
    const newWorkflow: Workflow = {
  id: Date.now(),
  name: values.name,
  model: values.model,
  size: values.size,
  aspectRatio: values.aspectRatio,  // 添加这一行
  prompt: values.prompt,
  createdAt: new Date().toISOString(),
    };
    const updated: Workflow[] = [...workflows, newWorkflow];
    setWorkflows(updated);
    localStorage.setItem('workflows', JSON.stringify(updated));
    message.success('工作流已创建');
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleDelete = (id: number) => {
    const updated: Workflow[] = workflows.filter((item: Workflow) => item.id !== id);
    setWorkflows(updated);
    localStorage.setItem('workflows', JSON.stringify(updated));
    message.success('已删除');
  };

  const handleRun = (id: number) => {
    router.push(`/workspace/generate?workflowId=${id}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 返回按钮 + 标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Button 
          onClick={() => window.history.back()} 
          style={{ marginRight: '12px' }}
          icon={<LeftOutlined />}
        >
          返回
        </Button>
        <Title level={2} style={{ margin: 0 }}>我的工作流</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} style={{ marginLeft: 'auto' }}>
          创建工作流
        </Button>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
        dataSource={workflows}
        renderItem={(item: Workflow) => (
          <List.Item>
            <Card
              title={item.name}
              extra={
                <Space>
                  <Button type="link" icon={<PlayCircleOutlined />} onClick={() => handleRun(item.id)}>
                    运行
                  </Button>
                  <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
                </Space>
              }
            >
              <p><strong>模型：</strong>{item.model}</p>
              <p><strong>尺寸：</strong>{item.size}</p>
              <p><strong>提示词：</strong>{item.prompt}</p>
              <p><small>创建于：{new Date(item.createdAt).toLocaleString()}</small></p>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="创建工作流"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="工作流名称" rules={[{ required: true }]}>
            <Input placeholder="例：夏季促销海报生成" />
          </Form.Item>
          <Form.Item name="model" label="模型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Nano Banana Pro">Nano Banana Pro</Select.Option>
              <Select.Option value="GPT Image 2">GPT Image 2</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="size" label="分辨率" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="1K">1K</Select.Option>
              <Select.Option value="2K">2K</Select.Option>
              <Select.Option value="4K">4K</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="aspectRatio" label="比例" rules={[{ required: true }]}>
  <Select>
    <Select.Option value="16:9">16:9 (宽屏)</Select.Option>
    <Select.Option value="4:3">4:3 (传统)</Select.Option>
    <Select.Option value="1:1">1:1 (方形)</Select.Option>
    <Select.Option value="3:4">3:4 (竖屏)</Select.Option>
    <Select.Option value="9:16">9:16 (手机竖屏)</Select.Option>
  </Select>
</Form.Item>
          <Form.Item name="prompt" label="提示词" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="描述你想要的画面" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存工作流
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}