'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Form, Select, Modal, List, message, Typography, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title } = Typography;
const { TextArea } = Input;

// 定义工作流类型
interface Workflow {
  id: number;
  name: string;
  model: string;
  size: string;
  prompt: string;
  createdAt: string;
}

export default function WorkflowPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);  // ← 修复1：显式类型
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const saved = localStorage.getItem('workflows');
    if (saved) {
      setWorkflows(JSON.parse(saved));
    }
  }, []);

  const handleCreate = (values: any) => {  // ← 修复2：参数类型
    const newWorkflow: Workflow = {
      id: Date.now(),
      name: values.name,
      model: values.model,
      size: values.size,
      prompt: values.prompt,
      createdAt: new Date().toISOString(),
    };
    const updated: Workflow[] = [...workflows, newWorkflow];  // ← 修复3：类型
    setWorkflows(updated);
    localStorage.setItem('workflows', JSON.stringify(updated));
    message.success('工作流已创建');
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleDelete = (id: number) => {  // ← 修复4：参数类型
    const updated: Workflow[] = workflows.filter((item: Workflow) => item.id !== id);  // ← 修复5：参数类型
    setWorkflows(updated);
    localStorage.setItem('workflows', JSON.stringify(updated));
    message.success('已删除');
  };

  const handleRun = (id: number) => {  // ← 修复6：参数类型
    router.push(`/workspace/generate?workflowId=${id}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={2}>我的工作流</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          创建工作流
        </Button>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
        dataSource={workflows}
        renderItem={(item: Workflow) => (  // ← 修复7：参数类型
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
          <Form.Item name="size" label="尺寸" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="1K">1K</Select.Option>
              <Select.Option value="2K">2K</Select.Option>
              <Select.Option value="4K">4K</Select.Option>
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