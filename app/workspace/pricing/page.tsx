'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Divider, Space, Tag, message } from 'antd';
import { CheckOutlined, CrownOutlined, RocketOutlined, StarOutlined } from '@ant-design/icons';
import { useCredits } from '@/app/contexts/CreditsContext';  // ← 导入全局积分
import { useSession } from 'next-auth/react';  

const { Title, Text } = Typography;

// 会员套餐数据（保持不变）
const membershipPlans = [
  {
    id: 'plan_basic', 
    name: '体验包',
    price: 0,
    currency: '¥',
    period: '/月',
    icon: <StarOutlined style={{ fontSize: 24, color: '#faad14' }} />,
    credits: 100,
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
     id: 'plan_pro',   
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
     id: 'plan_enterprise',
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
  { id: 'recharge_1000', amount: 200, credits: 1000 },   // ✅ 改为 'recharge_1000'
  { id: 'recharge_5000', amount: 800, credits: 5000 },   // ✅ 改为 'recharge_5000'
  { id: 'recharge_10000', amount: 1500, credits: 10000 }, // ✅ 改为 'recharge_10000'
];

export default function PricingPage() {
  // ---------- 使用全局积分状态 ----------
  const { credits, setCredits, refreshCredits } = useCredits();
  const { data: session } = useSession(); 
  const [loading, setLoading] = useState(false);

  // 页面加载时刷新积分
  useEffect(() => {
    refreshCredits();
  }, []);

  // ---------- 支付宝支付（保持不变） ----------
  const handleAlipayPayment = async (plan: any, type: 'recharge' | 'membership' = 'recharge') => {
    if (!session?.user?.phone) {
      message.warning('请先登录');
      return;
    }
  setLoading(true);
  try {
    console.log('创建订单请求:', { planId: plan.id, userId: session.user.phone });

    // 1. 先创建订单
    const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId: session.user.phone,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        message.error(orderData.error || '创建订单失败');
        return;
      }

    // 2. 再调用支付接口
    const response = await fetch('/api/payment/alipay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          amount: orderData.amount,
          subject: orderData.subject,
          credits: orderData.credits,
          type,
        }),
      });
      const data = await response.json();
    if (data.success && data.payUrl) {
      // ✅ 直接跳转到支付宝支付页面（支付完成后会回调 return_url）
      window.location.href = data.payUrl;
    } else {
      message.error(data.error || '支付失败');
    }
  } catch (error) {
    console.error('支付失败:', error);
    message.error('支付失败，请重试');
  } finally {
    setLoading(false);
  }
};

  // ---------- 免费套餐开通（使用 /api/recharge） ----------
  const handleFreePlan = async (plan: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.credits,
          plan: plan.name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // ✅ 更新全局积分
        setCredits(data.credits);
        message.success(`成功开通${plan.name}！获得 ${plan.credits} 积分，当前积分：${data.credits}`);
        // 铃铛会自动显示充值记录（由 /api/recharge 写入）
      } else {
        message.error(data.error || '开通失败，请重试');
      }
    } catch (error) {
      console.error('开通失败:', error);
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ---------- 会员套餐点击处理 ----------
  const handleMembershipPurchase = (plan: any) => {
    if (plan.price === 0) {
      handleFreePlan(plan);
    } else {
      handleAlipayPayment(plan, 'membership');
    }
  };

  // ---------- 积分充值点击处理 ----------
  const handleCreditRecharge = (plan: any) => {
    handleAlipayPayment(plan, 'recharge');
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={2}>价目表</Title>
        <Text strong style={{ fontSize: 16 }}>
          当前积分：{credits !== null ? credits : '加载中...'}
        </Text>
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
                  onClick={() => handleCreditRecharge(plan)}
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