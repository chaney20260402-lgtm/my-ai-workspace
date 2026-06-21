'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Empty, message, Typography, Space, Tag } from 'antd';
import { DeleteOutlined, PictureOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 定义资产类型
interface Asset {
  id: number;
  name: string;
  type: 'template' | 'image'; // 模版或生成图片
  category?: string; // 模版分类
  url?: string; // 图片URL（如果是生成图片）
  createdAt: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);

  // 加载资产数据
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = () => {
    const saved = localStorage.getItem('userAssets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAssets(parsed);
      } catch (e) {
        console.error('解析资产数据失败', e);
        setAssets([]);
      }
    } else {
      // 如果没有数据，添加一些模拟数据以便演示
      const mockAssets: Asset[] = [
        { id: 1, name: '电商促销海报', type: 'template', category: '电商', createdAt: new Date().toISOString() },
        { id: 2, name: '产品详情页', type: 'template', category: '电商', createdAt: new Date().toISOString() },
        { id: 3, name: '生成的猫咪图片', type: 'image', url: 'https://picsum.photos/seed/cat/400/300', createdAt: new Date().toISOString() },
      ];
      setAssets(mockAssets);
      localStorage.setItem('userAssets', JSON.stringify(mockAssets));
    }
  };

  // 删除资产
  const handleDelete = (id: number) => {
    const newAssets = assets.filter(item => item.id !== id);
    setAssets(newAssets);
    localStorage.setItem('userAssets', JSON.stringify(newAssets));
    message.success('已删除');
  };

  // 清空所有资产（可选）
  const handleClearAll = () => {
    if (assets.length === 0) return;
    if (window.confirm('确定要清空所有资产吗？')) {
      setAssets([]);
      localStorage.setItem('userAssets', JSON.stringify([]));
      message.success('已清空');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={2} style={{ margin: 0 }}>我的资产</Title>
        {assets.length > 0 && (
          <Button danger onClick={handleClearAll}>
            清空所有
          </Button>
        )}
      </div>

      {assets.length === 0 ? (
        <Empty description="暂无资产，去首页生成或收藏吧！" />
      ) : (
        <Row gutter={[16, 16]}>
          {assets.map((item) => (
            <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                cover={
                  item.type === 'image' && item.url ? (
                    <img
                      alt={item.name}
                      src={item.url}
                      style={{ height: 150, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: 150, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileTextOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                    </div>
                  )
                }
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item.id)}
                  >
                    删除
                  </Button>
                ]}
              >
                <Card.Meta
                  title={item.name}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">
                        {item.type === 'template' ? '模版' : '生成图片'}
                      </Text>
                      {item.category && <Tag color="blue">{item.category}</Tag>}
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}