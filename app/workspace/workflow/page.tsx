'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Form, Select, Modal, List, message, Typography, Space, Empty, Row, Col } from 'antd';
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

  // 点击 + 号，跳转到新建工作流
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
        <span style={{ marginLeft: 'auto', color: '#999' }}>
          共 {workflows.length} 个工作流
        </span>
      </div>

      {/* 工作流网格 */}
      <Row gutter={[16, 16]}>
        {/* + 号卡片（固定在首位） */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            hoverable
            style={{
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #d9d9d9',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            bodyStyle={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 240,
              width: '100%',
            }}
            onClick={handleCreateNew}
          >
            <PlusOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 8 }} />
            <span style={{ color: '#999', fontSize: 14 }}>新建工作流</span>
          </Card>
        </Col>

        {/* 工作流卡片列表 */}
        {workflows.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              title={
                <span style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</span>
              }
              extra={
                <Space size={4}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleRun(item.id)}
                    style={{ color: '#1677ff' }}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item.id)}
                  />
                </Space>
              }
              style={{
                minHeight: 280,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.3s',
              }}
              bodyStyle={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#555' }}>
                  <strong>模型：</strong>{item.model}
                </p>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#555' }}>
                  <strong>分辨率：</strong>{item.size}
                </p>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#555' }}>
                  <strong>比例：</strong>{item.aspectRatio}
                </p>
                <p
                  style={{
                    margin: '8px 0 4px 0',
                    fontSize: 13,
                    color: '#666',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.5',
                  }}
                >
                  <strong>提示词：</strong>{item.prompt || '（未填写）'}
                </p>
              </div>
              <div style={{ marginTop: '12px', fontSize: 12, color: '#bbb', borderTop: '1px solid #f5f5f5', paddingTop: '8px' }}>
                创建于：{new Date(item.createdAt).toLocaleString()}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 空状态 */}
      {workflows.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Empty description="暂无工作流，点击左上角 + 号创建一个吧" />
        </div>
      )}
    </div>
  );
}