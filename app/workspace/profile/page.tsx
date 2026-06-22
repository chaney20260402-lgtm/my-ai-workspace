'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Divider, Space, Avatar, Button, Row, Col, message, Tag, Table } from 'antd';
import { UserOutlined, CheckOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { getCreditRecords, CreditRecord } from '@/lib/creditRecords';
import { getUserAvatar, setUserAvatar, getAvatarBySeed, avatarSeeds } from '@/lib/avatar';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);

  useEffect(() => {
    setRecords(getCreditRecords());
    const saved = getUserAvatar();
    setCurrentAvatar(saved);
    // 找出当前使用的 seed（如果有）
    if (saved) {
      const match = avatarSeeds.find((seed) => saved.includes(seed));
      setSelectedSeed(match || null);
    }
  }, []);

  const handleSelectAvatar = (seed: string) => {
    const url = getAvatarBySeed(seed);
    setUserAvatar(seed);
    setCurrentAvatar(url);
    setSelectedSeed(seed);
    message.success('头像已更换');
  };

  // 积分记录表格列（同上）
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

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 用户信息 + 当前头像 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Avatar
              size={80}
              src={currentAvatar || undefined}
              icon={!currentAvatar ? <UserOutlined /> : undefined}
            />
            <div>
              <Title level={4}>{session?.user?.name || '用户'}</Title>
              <Text type="secondary">{session?.user?.email || '未绑定邮箱'}</Text>
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