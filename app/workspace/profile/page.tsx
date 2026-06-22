'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Divider, Space, Avatar, Table, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { getCreditRecords, CreditRecord } from '@/lib/creditRecords';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<CreditRecord[]>([]);

  useEffect(() => {
    setRecords(getCreditRecords());
  }, []);

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
          {/* 用户信息部分保持不变 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Avatar size={64} icon={<UserOutlined />} />
            <div>
              <Title level={4}>{session?.user?.name || '用户'}</Title>
              <Text type="secondary">{session?.user?.email || '未绑定邮箱'}</Text>
            </div>
          </div>
          <Divider />

          {/* 积分记录表格 */}
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