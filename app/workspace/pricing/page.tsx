'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Divider, Space, Tag, message } from 'antd';
import { CheckOutlined, CrownOutlined, RocketOutlined, StarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 会员套餐数据
const membershipPlans = [
  {
    id: 'free',
    name: '体验包',
    price: 0,
    currency: '¥',
    period: '/月',
    icon: <StarOutlined style={{ fontSize: 24, color: '#faad14' }} />,
    credits: 100, // 赠送积分
    features: [
      '当月deals额度: 100',
      '模板使用',
      '团队与协作效益',
      '账号数量: 1个',
      '商品库多席位: 1个',
      '工作流工具的使用',
      '编辑模版',
      'AI工具权益',
      '爆款复刻工具使用',
      '爆款复刻后工作流获取',
      '形象制作和形象库使用',
      '白底图制作工具使用',
    ],
    color: '#f0f2f5',
    buttonColor: '#1890ff',
  },
  {
    id: 'pro',
    name: '进阶包',
    price: 200,
    currency: '¥',
    period: '/月',
    icon: <RocketOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
    credits: 1500,
    features: [
      '当月积分额度: 1500',
      '模板使用',
      '团队与协作效益',
      '账号数量: 4个',
      '商品库多席位: 3个',
      '工作流工具的使用',
      '编辑模版',
      'AI工具权益',
      '爆款复刻工具使用',
      '爆款复刻后工作流获取',
      '形象制作和形象库使用',
      '白底图制作工具使用',
    ],
    color: '#e6f7ff',
    buttonColor: '#1890ff',
  },
  {
    id: 'business',
    name: '专业包',
    price: 1000,
    currency: '¥',
    period: '/月',
    icon: <CrownOutlined style={{ fontSize: 24, color: '#faad14' }} />,
    credits: 7500,
    features: [
      '当月积分额度: 7500',
      '模板使用',
      '团队与协作效益',
      '账号数量: 20个',
      '商品库多席位: 不限制',
      '工作流工具的使用',
      '编辑模版',
      'AI工具权益',
      '爆款复刻工具使用',
      '爆款复刻后工作流获取',
      '形象制作和形象库使用',
      '白底图制作工具使用',
    ],
    color: '#fff7e6',
    buttonColor: '#faad14',
  },
];

// 积分充值套餐
const creditPlans = [
  { id: 'credit1', amount: 200, credits: 1000 },
  { id: 'credit2', amount: 800, credits: 5000 },
  { id: 'credit3', amount: 1500, credits: 10000 },
];

export default function PricingPage() {
  const [credits, setCredits] = useState(150);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('userCredits');
    if (saved) {
      setCredits(parseInt(saved));
    } else {
      localStorage.setItem('userCredits', '150');
      setCredits(150);
    }
  }, []);

  // ---------- 支付宝支付 ----------
  const handleAlipayPayment = async (plan: any, type: 'recharge' | 'membership' = 'recharge') => {
    setLoading(true);
    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const response = await fetch('/api/payment/alipay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: plan.price,
          subject: type === 'recharge' ? `充值 ${plan.credits} 积分` : `开通${plan.name}会员`,
          credits: plan.credits || 0,
          type,
        }),
      });
      const data = await response.json();
      if (data.success && data.payUrl) {
        // 跳转到支付宝支付页面
        window.location.href = data.payUrl;
      } else {
        message.error(data.error || '支付失败');
        setLoading(false);
      }
    } catch (error) {
      console.error('支付请求失败:', error);
      message.error('支付请求失败，请稍后重试');
      setLoading(false);
    }
  };

  // ---------- 免费套餐开通（不支付） ----------
  const handleFreePlan = (plan: any) => {
    const current = parseInt(localStorage.getItem('userCredits') || '0');
    const newCredits = current + plan.credits;
    localStorage.setItem('userCredits', String(newCredits));
    setCredits(newCredits);
    message.success(`成功开通${plan.name}！获得 ${plan.credits} 积分`);
    window.location.reload();
  };

  // ---------- 会员套餐点击处理 ----------
  const handleMembershipPurchase = (plan: any) => {
    if (plan.price === 0) {
      handleFreePlan(plan);
    } else {
      handleAlipayPayment(plan, 'membership');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={2}>价目表</Title>
        <Text strong style={{ fontSize: 16 }}>当前积分：{credits}</Text>
      </div>

      {/* ========== 会员专区 ========== */}
      <Title level={3} style={{ marginBottom: 16 }}>
        <CrownOutlined style={{ marginRight: 8 }} />
        会员套餐
      </Title>
      <Row gutter={[16, 16]}>
        {membershipPlans.map((plan) => (
          <Col xs={24} sm={12} lg={8} key={plan.id}>
            <Card
              title={
                <Space>
                  {plan.icon}
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{plan.name}</span>
                </Space>
              }
              extra={
                <Tag color={plan.id === 'business' ? 'gold' : 'blue'}>
                  {plan.id === 'free' ? '免费' : plan.id === 'pro' ? '推荐' : '旗舰'}
                </Tag>
              }
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderColor: plan.id === 'business' ? '#faad14' : '#e8e8e8',
                borderWidth: plan.id === 'business' ? 2 : 1,
              }}
              bodyStyle={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
              headStyle={{ backgroundColor: plan.color }}
            >
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Text type="secondary" delete={plan.price === 0} style={{ fontSize: 14 }}>
                  {plan.currency}{plan.price}{plan.period}
                </Text>
                {plan.price > 0 && (
                  <Text strong style={{ fontSize: 24, color: '#1677ff', marginLeft: 8 }}>
                    {plan.currency}{plan.price}{plan.period}
                  </Text>
                )}
              </div>
              <div style={{ flex: 1 }}>
                {plan.features.map((feature, idx) => (
                  <div key={idx} style={{ marginBottom: 6, display: 'flex', alignItems: 'flex-start' }}>
                    <CheckOutlined style={{ color: '#52c41a', marginRight: 8, marginTop: 4 }} />
                    <Text style={{ fontSize: 13 }}>{feature}</Text>
                  </div>
                ))}
              </div>
              <Button
                type="primary"
                block
                size="large"
                onClick={() => handleMembershipPurchase(plan)}
                loading={loading}
                style={{ marginTop: 16, backgroundColor: plan.buttonColor, borderColor: plan.buttonColor }}
              >
                {plan.price === 0 ? '立即体验' : '立即购买'}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider style={{ margin: '32px 0' }} />

      {/* ========== 积分充值 ========== */}
      <Title level={3} style={{ marginBottom: 16 }}>
        <RocketOutlined style={{ marginRight: 8 }} />
        积分充值
      </Title>
      <Row gutter={[16, 16]}>
        {creditPlans.map((plan) => (
          <Col xs={24} sm={8} key={plan.id}>
            <Card
              title={`¥${plan.amount}`}
              extra={<Tag color="green">{plan.credits} 积分</Tag>}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1677ff' }}>
                {plan.credits}
              </div>
              <Text type="secondary">积分</Text>
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => handleAlipayPayment(plan, 'recharge')}
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