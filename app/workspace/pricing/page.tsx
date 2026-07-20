'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Divider, Space, Tag, message, Modal, Spin } from 'antd';
import { CheckOutlined, CrownOutlined, RocketOutlined, StarOutlined } from '@ant-design/icons';
import { useCredits } from '@/app/contexts/CreditsContext';
import { useSession } from 'next-auth/react';


const { Title, Text } = Typography;

// 会员套餐数据
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
      '当月积分额度: 20',
      '同时调用数量: 5',
      '可使用模型数量: 1',
      '保存工作流数量: 1',
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
      '同时调用数量: 10',
      '可使用模型数量: 10',
      '保存工作流数量: 3',
      '导出PSD功能分图层',
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
      '同时调用数量: 15',
      '可使用模型数量: 12+',
      '保存工作流数量: 3+',
      '导出PSD功能分图层',
      
    ],
    color: '#fff7e6',
    buttonColor: '#faad14',
  },
];

// 积分充值套餐
const creditPlans = [
  { id: 'recharge_1000', amount: 200, credits: 1000 },
  { id: 'recharge_5000', amount: 800, credits: 5000 },
  { id: 'recharge_10000', amount: 1500, credits: 10000 },
];

export default function PricingPage() {
  const { credits, setCredits, refreshCredits } = useCredits();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showCuteModal, setShowCuteModal] = useState(false);

  // ========== 支付弹窗状态 ==========
  const [paymentModal, setPaymentModal] = useState<{
    visible: boolean;
    planId: string;
    orderId: string;
    amount: number;
    subject: string;
    credits: number;
  }>({
    visible: false,
    planId: '',
    orderId: '',
    amount: 0,
    subject: '',
    credits: 0,
  });

  useEffect(() => {
    refreshCredits();
  }, []);

  // ========== 创建订单并显示支付弹窗 ==========
  const handlePayment = async (plan: any, type: 'recharge' | 'membership' = 'recharge') => {
    if (!session?.user?.phone) {
      message.warning('请先登录');
      return;
    }

    setLoading(true);
    try {
      console.log('创建订单请求:', { planId: plan.id, userId: session.user.phone });

      // 1. 创建订单
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

      // 2. 显示支付方式选择弹窗
      setPaymentModal({
        visible: true,
        planId: plan.id,
        orderId: orderData.orderId,
        amount: orderData.amount,
        subject: orderData.subject,
        credits: orderData.credits,
      });
    } catch (error) {
      console.error('创建订单失败:', error);
      message.error('创建订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ========== 支付宝支付 ==========
  const handlePayWithAlipay = async () => {
    setPaying(true);
    try {
      const response = await fetch('/api/payment/alipay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: paymentModal.orderId,
          amount: paymentModal.amount,
          subject: paymentModal.subject,
          credits: paymentModal.credits,
          type: paymentModal.planId.startsWith('recharge') ? 'recharge' : 'membership',
        }),
      });
      const data = await response.json();
      if (data.success && data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        message.error(data.error || '支付创建失败');
      }
    } catch (error) {
      console.error('支付宝支付失败:', error);
      message.error('支付失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  // ========== 微信支付 ==========
  const handlePayWithWechat = async () => {
    setPaying(true);
    try {
      const response = await fetch('/api/payment/wechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: paymentModal.planId,
          credits: paymentModal.credits,
          amount: paymentModal.amount,
          subject: paymentModal.subject,
        }),
      });
      const data = await response.json();
      if (data.success && data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        message.error(data.error || '支付创建失败');
      }
    } catch (error) {
      console.error('微信支付失败:', error);
      message.error('支付失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  // ========== 关闭支付弹窗 ==========
  const handleCloseModal = () => {
    setPaymentModal({ ...paymentModal, visible: false });
    refreshCredits();
  };

  // ========== 免费套餐开通 ==========
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
      setCredits(data.credits);
      message.success(`🎉 成功开通${plan.name}！获得 ${plan.credits} 积分，当前积分：${data.credits}`);
    } else {
      // ✅ 检测到“已领取”错误，显示可爱弹窗
      if (data.error?.includes('已领取过体验包')) {
        setShowCuteModal(true);
      } else {
        message.error(data.error || '开通失败，请重试');
      }
    }
  } catch (error) {
    console.error('开通失败:', error);
    message.error('网络错误，请重试');
  } finally {
    setLoading(false);
  }
};

  // ========== 会员套餐点击处理 ==========
  const handleMembershipPurchase = (plan: any) => {
    if (plan.price === 0) {
      handleFreePlan(plan);
    } else {
      handlePayment(plan, 'membership');
    }
  };

  // ========== 积分充值点击处理 ==========
  const handleCreditRecharge = (plan: any) => {
    handlePayment(plan, 'recharge');
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
                <Tag color={plan.id === 'plan_enterprise' ? 'gold' : 'blue'}>
                  {plan.id === 'plan_basic' ? '免费' : plan.id === 'plan_pro' ? '推荐' : '旗舰'}
                </Tag>
              }
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderColor: plan.id === 'plan_enterprise' ? '#faad14' : '#e8e8e8',
                borderWidth: plan.id === 'plan_enterprise' ? 2 : 1,
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
              title={
    <span style={{ fontSize: 28, fontWeight: 700, color: '#580f0f' }}>
      ¥{plan.amount}
    </span>
  }
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

      {/* ========== 支付方式选择弹窗 ========== */}
      <Modal
        title="选择支付方式"
        open={paymentModal.visible}
        onCancel={handleCloseModal}
        footer={null}
        maskClosable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: 20, marginBottom: 8 }}>支付金额</p>
          <p style={{ fontSize: 36, fontWeight: 'bold', color: '#1677ff' }}>
            ¥{paymentModal.amount}
          </p>
          <p style={{ color: '#999', marginBottom: 24 }}>{paymentModal.subject}</p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
            {/* 支付宝 */}
            <Button
              size="large"
              style={{
                width: 140,
                height: 100,
                flexDirection: 'column',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #1677ff',
              }}
              onClick={handlePayWithAlipay}
              loading={paying}
            >
              <span style={{ fontSize: 32 }}>💳</span>
              <span>支付宝</span>
            </Button>

            {/* 微信支付 */}
            <Button
              size="large"
              style={{
                width: 140,
                height: 100,
                flexDirection: 'column',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #07C160',
              }}
              onClick={handlePayWithWechat}
              loading={paying}
            >
              <span style={{ fontSize: 32 }}>💚</span>
              <span>微信支付</span>
            </Button>
          </div>
          <p style={{ color: '#ccc', fontSize: 12, marginTop: 16 }}>
            🔒 安全支付
          </p>
        </div>
      </Modal>

      {/* ========== 支付加载遮罩 ========== */}
      {paying && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在跳转支付...</p>
          </div>
        </div>
      )}
         <Modal
        open={showCuteModal}
        footer={null}
        closable={false}
        centered
        width={380}
        maskClosable={false}
        bodyStyle={{
          padding: '32px 24px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fff5f5 0%, #fef3e2 100%)',
          borderRadius: '16px',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 8 }}>🎈</div>
        <h2 style={{ color: '#ff6b6b', marginBottom: 8, fontSize: 22 }}>
          哎呀，您已经领取过啦！
        </h2>
        <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
          每个用户只能领取一次体验包哦～<br />
          试试其他套餐吧！💪
        </p>
        <Button
          type="primary"
          size="large"
          onClick={() => setShowCuteModal(false)}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
            border: 'none',
            borderRadius: '20px',
            padding: '0 40px',
            height: '44px',
            fontSize: '16px',
          }}
        >
          好的，知道啦 ✨
        </Button>
      </Modal>
    </div>
  );
}
