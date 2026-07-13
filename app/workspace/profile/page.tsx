'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Divider, Space, Avatar, Button, Row, Col, message, Tag, Table, Spin } from 'antd';
import { UserOutlined, CheckOutlined, LeftOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { getCreditRecords, CreditRecord } from '@/lib/creditRecords';
import { getUserAvatar, setUserAvatar, getAvatarBySeed, avatarSeeds } from '@/lib/avatar';
import { useCredits } from '@/app/contexts/CreditsContext';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { data: session } = useSession();
  // ✅ 获取 credits 和 setCredits
  const { credits, setCredits } = useCredits();
  
  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  
  // ✅ 用户信息（从 API 获取）
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 加载积分记录（原有逻辑）
  useEffect(() => {
    setRecords(getCreditRecords());
    const saved = getUserAvatar();
    setCurrentAvatar(saved);
    if (saved) {
      const match = avatarSeeds.find((seed) => saved.includes(seed));
      setSelectedSeed(match || null);
    }
  }, []);

  // ✅ 从 API 获取用户信息（包含 membershipType、inviteRewards）
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/user/profile');
        const result = await res.json();
        if (result.success) {
          setUserInfo(result.data);
          // ✅ 同步积分到 Context（确保右上角和个人中心一致）
          if (result.data.credits !== undefined) {
            setCredits(result.data.credits);
          }
        } else {
          console.error('获取用户信息失败:', result.error);
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  const handleSelectAvatar = (seed: string) => {
    const url = getAvatarBySeed(seed);
    setUserAvatar(seed);
    setCurrentAvatar(url);
    setSelectedSeed(seed);
    message.success('头像已更换');
  };

  // ✅ 会员标签配置
  const membershipType = userInfo?.membershipType || 'experience';
  const membershipConfig = {
    experience: { label: '体验会员', color: '#999', bgColor: '#f5f5f5' },
    advanced: { label: '进阶会员', color: '#1890ff', bgColor: '#e6f7ff' },
    professional: { label: '专业会员', color: '#faad14', bgColor: '#fff7e6' },
  };
  const config = membershipConfig[membershipType as keyof typeof membershipConfig] || membershipConfig.experience;

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const map = {
          recharge: <Tag color="green">充值</Tag>,
          consume: <Tag color="red">消耗</Tag>,
          refund: <Tag color="orange">退款</Tag>,
        };
        return map[type as keyof typeof map] || type;
      },
    },
    {
      title: '变动积分',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount > 0 ? '+' : ''}{amount}
        </span>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  // 如果正在加载用户信息，显示加载状态
  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 返回按钮 + 标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Button 
          onClick={() => window.history.back()} 
          style={{ marginRight: '12px' }}
          icon={<LeftOutlined />}
        >
          返回
        </Button>
        <Title level={2} style={{ margin: 0 }}>个人中心</Title>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* ===== 用户信息 + 当前头像 ===== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Avatar
              size={80}
              src={currentAvatar || undefined}
              icon={!currentAvatar ? <UserOutlined /> : undefined}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {session?.user?.phone || session?.user?.name || '用户'}
                </Title>
                {/* ✅ 会员标签 */}
                <Tag
                  color={config.color}
                  style={{
                    border: `1px solid ${config.color}`,
                    color: config.color,
                    backgroundColor: config.bgColor,
                    borderRadius: 12,
                    padding: '0 12px',
                    fontWeight: 500,
                  }}
                >
                  {config.label}
                </Tag>
              </div>
              <div style={{ marginTop: 4 }}>
                {/* ✅ 使用 credits（来自 Context），而不是 userInfo?.credits */}
                <Text type="secondary">积分：{credits ?? 0}</Text>
                {userInfo?.inviteRewards > 0 && (
                  <Text type="secondary" style={{ marginLeft: 16 }}>
                    🌟 邀请奖励：{userInfo.inviteRewards} 积分
                  </Text>
                )}
              </div>
              {userInfo?.myInviteCode && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary">
                    我的邀请码：<Text strong style={{ color: '#1677ff' }}>{userInfo.myInviteCode}</Text>
                  </Text>
                </div>
              )}
            </div>
          </div>
          <Divider />

          {/* 头像选择 */}
          <div>
            <Title level={4}>选择头像</Title>
            <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
              {avatarSeeds.map((seed) => {
                const url = getAvatarBySeed(seed);
                const isSelected = selectedSeed === seed;
                return (
                  <Col key={seed}>
                    <div
                      style={{
                        position: 'relative',
                        border: isSelected ? '3px solid #1677ff' : '2px solid #e8e8e8',
                        borderRadius: '50%',
                        padding: 4,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => handleSelectAvatar(seed)}
                    >
                      <Avatar
                        size={56}
                        src={url}
                        style={{ borderRadius: '50%' }}
                      />
                      {isSelected && (
                        <CheckOutlined
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            color: '#1677ff',
                            background: '#fff',
                            borderRadius: '50%',
                            padding: 2,
                            fontSize: 14,
                          }}
                        />
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
          <Divider />

          {/* 积分记录 */}
          <div>
            <Title level={4}>积分记录</Title>
            <Table
              dataSource={records}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: '暂无积分记录' }}
            />
          </div>
        </Space>
      </Card>
    </div>
  );
}