'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, message, Typography, Space, Empty, Row, Col, Tag } from 'antd';
import { DeleteOutlined, PlayCircleOutlined, LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

interface Workflow {
  id: number;
  name: string;
  model: string;
  size: string;
  aspectRatio: string;
  prompt?: string;
  prompts?: string[];
  platform?: string;
  language?: string;
  referenceImages?: string[];
  createdAt: string;
  updatedAt?: string;
  generatedImages?: any[];
}

export default function WorkflowPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------- 加载工作流列表（从数据库） ----------
  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workflow');
      const result = await res.json();
      if (result.success) {
        setWorkflows(result.data || []);
      } else {
        message.error(result.error || '加载工作流列表失败');
      }
    } catch (error) {
      console.error('加载工作流失败:', error);
      message.error('加载工作流列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  // ---------- 删除工作流 ----------
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        message.success('已删除');
        setWorkflows(prev => prev.filter(w => w.id !== id));
      } else {
        message.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败，请重试');
    }
  };

  // ---------- 运行工作流 ----------
  const handleRun = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/workspace/generate?workflowId=${id}`);
  };

  // ---------- 新建工作流 ----------
  const handleCreateNew = () => {
    router.push('/workspace/generate');
  };

  // ---------- 获取提示词显示文本 ----------
  const getPromptText = (item: Workflow) => {
    if (item.prompts && item.prompts.length > 0) {
      const nonEmpty = item.prompts.filter(p => p.trim());
      if (nonEmpty.length === 0) return '（未填写）';
      return nonEmpty.join('；');
    }
    return item.prompt || '（未填写）';
  };

  // ---------- 加载状态 ----------
  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
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

      <Row gutter={[16, 16]}>
        {/* 新建工作流卡片 */}
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
            }}
            bodyStyle={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 240,
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
              hoverable
              onClick={() => handleRun(item.id)}
              title={<span style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</span>}
              extra={
                <Space size={4}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={(e) => handleRun(item.id, e)}
                    style={{ color: '#1677ff' }}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => handleDelete(item.id, e)}
                  />
                </Space>
              }
              style={{
                minHeight: 280,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                cursor: 'pointer',
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
                {(item.platform || item.language) && (
                  <p style={{ margin: '4px 0', fontSize: 12, color: '#888' }}>
                    {item.platform && <Tag>{item.platform}</Tag>}
                    {item.language && <Tag>{item.language}</Tag>}
                  </p>
                )}
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
                  <strong>提示词：</strong>{getPromptText(item)}
                </p>
              </div>
              <div style={{ marginTop: '12px', fontSize: 12, color: '#bbb', borderTop: '1px solid #f5f5f5', paddingTop: '8px' }}>
                创建于：{new Date(item.createdAt).toLocaleString()}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {workflows.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Empty description="暂无工作流，点击 + 号创建一个吧" />
        </div>
      )}
    </div>
  );
}

