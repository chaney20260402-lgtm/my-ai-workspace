'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, message, Modal } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 套餐数据
const plans = [
  { id: 1, name: '基础包', credits: 100, price: 9.9, discount: 0 },
  { id: 2, name: '进阶包', credits: 500, price: 39.9, discount: 10 },
  { id: 3, name: '专业包', credits: 1500, price: 99.9, discount: 20 },
  { id: 4, name: '旗舰包', credits: 5000, price: 299.9, discount: 30 },
];

export default function PricingPage() {
  const [credits, setCredits] = useState(150); // 默认值
  const [loading, setLoading] = useState(false);

  // 加载积分
  useEffect(() => {
    const saved = localStorage.getItem('userCredits');
    if (saved) {
      setCredits(parseInt(saved));
    } else {
      // 首次访问，设置默认积分
      localStorage.setItem('userCredits', '150');
      setCredits(150);
    }
  }, []);

  const handlePurchase = (plan: any) => {
    setLoading(true);
    // 模拟支付过程
    setTimeout(() => {
      const current = parseInt(localStorage.getItem('userCredits') || '150');
      const newCredits = current + plan.credits;
      localStorage.setItem('userCredits', String(newCredits));
      setCredits(newCredits);
      message.success(`成功充值 ${plan.credits} 积分！当前积分：${newCredits}`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={2}>价目表</Title>
        <Text strong>当前积分：{credits}</Text>
      </div>
      <Row gutter={[16, 16]} justify="center">
        {plans.map((plan) => (
          <Col key={plan.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              title={plan.name}
              extra={
                plan.discount > 0 ? (
                  <Text type="danger" delete>
                    ¥{plan.price}
                  </Text>
                ) : null
              }
              style={{
                textAlign: 'center',
                borderColor: plan.discount > 0 ? '#faad14' : '#d9d9d9',
              }}
              headStyle={{ backgroundColor: plan.discount > 0 ? '#fff7e6' : '#fafafa' }}
            >
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1677ff' }}>
                {plan.credits}
              </p>
              <Text type="secondary">积分</Text>
              <div style={{ margin: '12px 0' }}>
                <Text strong style={{ fontSize: '20px' }}>
                  ¥{plan.price}
                </Text>
                {plan.discount > 0 && (
                  <Text type="success" style={{ marginLeft: '8px' }}>
                    省 {plan.discount}%
                  </Text>
                )}
              </div>
              <div style={{ marginTop: '20px' }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => handlePurchase(plan)}
                  loading={loading}
                >
                  立即充值
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}