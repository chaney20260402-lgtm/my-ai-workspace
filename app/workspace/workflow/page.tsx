'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Form, Select, Modal, List, message, Typography, Space, Empty } from 'antd';
import { DeleteOutlined, PlayCircleOutlined, LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

interface Workflow {
  id: number;
  name: string;
  model: string;
  size: string;
  aspectRatio: string;
  prompt: string;
  createdAt: string;
}

export default function WorkflowPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('workflows');
    if (saved) {
      setWorkflows(JSON.parse(saved));
    }
  }, []);

  const handleDelete = (id: number) => {
    const updated = workflows.filter((item) => item.id !== id);
    setWorkflows(updated);
    localStorage.setItem('workflows', JSON.stringify(updated));
    message.success('已删除');
  };

  const handleRun = (id: number) => {
    router.push(`/workspace/generate?workflowId=${id}`);
  };

  // 点击 + 号，跳转到新建工作流（无 workflowId 参数）
  const handleCreateNew = () => {
    router.push('/workspace/generate');
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 返回按钮 + 标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <Button
          onClick={() => window.history.back()}
          style={{ marginRight: '12px' }}
          icon={<LeftOutlined />}
        >
          返回
        </Button>
        <Title level={2} style={{ margin: 0 }}>我的工作流</Title>
      </div>

      {/* 工作流列表 */}
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
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
              <p><strong>分辨率：</strong>{item.size}</p>
              <p><strong>比例：</strong>{item.aspectRatio}</p>
              <p><strong>提示词：</strong>{item.prompt}</p>
              <p><small>创建于：{new Date(item.createdAt).toLocaleString()}</small></p>
            </Card>
          </List.Item>
        )}
      />

      {/* 新建工作流的大 + 号按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '32px',
        }}
      >
        <Card
          hoverable
          style={{
            width: 200,
            height: 200,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '2px dashed #d9d9d9',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          bodyStyle={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
          }}
          onClick={handleCreateNew}
        >
          <PlusOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />
        </Card>
      </div>
    </div>
  );
}