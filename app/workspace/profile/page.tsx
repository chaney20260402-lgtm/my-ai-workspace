'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Divider,
  Space,
  Avatar,
  Button,
  Statistic,
  Row,
  Col,
  message,
  Descriptions,
  Tag,
} from 'antd';
import {
  UserOutlined,
  CopyOutlined,
  ShareAltOutlined,
  GiftOutlined,
  FileImageOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { data: session } = useSession();

  // 状态
  const [inviteCode, setInviteCode] = useState('');
  const [credits, setCredits] = useState(0);
  const [assetsCount, setAssetsCount] = useState(0);
  const [workflowsCount, setWorkflowsCount] = useState(0);

  // 生成邀请码（首次访问时生成并保存）
  useEffect(() => {
    // 1. 读取或生成邀请码
    let code = localStorage.getItem('inviteCode');
    if (!code) {
      // 生成格式：用户ID(或时间戳) + 随机字符
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      code = `AG${timestamp.slice(-4)}${random}`;
      localStorage.setItem('inviteCode', code);
    }
    setInviteCode(code);

    // 2. 读取积分
    const savedCredits = localStorage.getItem('userCredits');
    setCredits(savedCredits ? parseInt(savedCredits) : 150);

    // 3. 读取资产数量
    const savedAssets = localStorage.getItem('userAssets');
    if (savedAssets) {
      setAssetsCount(JSON.parse(savedAssets).length);
    }

    // 4. 读取工作流数量
    const savedWorkflows = localStorage.getItem('workflows');
    if (savedWorkflows) {
      setWorkflowsCount(JSON.parse(savedWorkflows).length);
    }
  }, []);

  // 复制邀请码
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    message.success('邀请码已复制！分享给朋友，双方各得 10 积分');
  };

  // 分享邀请链接
  const handleShare = () => {
    const shareText = `🎨 我在 Aguala AI 创作平台，邀请你一起来创作！\n邀请码：${inviteCode}\n注册时填写邀请码，双方各得 10 积分！`;
    navigator.clipboard.writeText(shareText);
    message.success('邀请信息已复制，快去分享吧！');
  };

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      {/* 用户卡片 */}
      <Card
        style={{ borderRadius: 16, marginBottom: 24 }}
        bodyStyle={{ padding: '32px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Avatar size={80} icon={<UserOutlined />} src={session?.user?.image || undefined} />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {session?.user?.name || '用户'}
            </Title>
            <Text type="secondary">{session?.user?.email || '未绑定邮箱'}</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">已认证</Tag>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Button type="primary" icon={<ShareAltOutlined />} onClick={handleShare}>
              邀请好友
            </Button>
          </div>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="积分余额"
              value={credits}
              prefix={<WalletOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="我的资产"
              value={assetsCount}
              prefix={<FileImageOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="工作流"
              value={workflowsCount}
              prefix={<GiftOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 邀请码区域 */}
      <Card title="邀请好友" style={{ borderRadius: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Text strong>邀请码：</Text>
          <Text code style={{ fontSize: 20, padding: '4px 12px' }}>
            {inviteCode}
          </Text>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制
          </Button>
          <Text type="secondary">
            💡 分享邀请码给朋友，双方各得 <Tag color="gold">10 积分</Tag>
          </Text>
        </div>
        <Divider />
        <div>
          <Text type="secondary">邀请链接：</Text>
          <Text code style={{ fontSize: 12 }}>
            https://aguala.ai/register?invite={inviteCode}
          </Text>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(`https://aguala.ai/register?invite=${inviteCode}`);
              message.success('邀请链接已复制');
            }}
          >
            复制链接
          </Button>
        </div>
      </Card>

      {/* 个人信息 */}
      <Card title="个人信息" style={{ borderRadius: 16 }}>
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="用户名">{session?.user?.name || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{session?.user?.email || '未绑定'}</Descriptions.Item>
          <Descriptions.Item label="手机号">138****8000（示例）</Descriptions.Item>
          <Descriptions.Item label="注册时间">2025-06-20（示例）</Descriptions.Item>
          <Descriptions.Item label="邀请人数">0 人</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
