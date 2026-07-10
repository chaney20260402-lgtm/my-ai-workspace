'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, message, Typography } from 'antd';

const { Title } = Typography;

export default function UsageClient() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/usage/stats')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch(err => {
        message.error('加载数据失败: ' + err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Spin size="large" tip="加载统计数据..." />
      </div>
    );
  }

  // 模型使用情况表格列
  const modelColumns = [
    { title: '模型', dataIndex: 'model', key: 'model' },
    { title: '调用次数', dataIndex: '_count', key: 'count', render: (v: any) => v?.model || 0 },
    { title: '消耗积分', dataIndex: '_sum', key: 'credits', render: (v: any) => v?.creditsUsed || 0 },
  ];

  // 用户使用情况表格列
  const userColumns = [
    { title: '用户手机号', dataIndex: 'phone', key: 'phone' },
    { title: '调用次数', dataIndex: 'count', key: 'count' },
    { title: '消耗积分', dataIndex: 'credits', key: 'credits' },
  ];

  // 最近记录表格列
  const recentColumns = [
    { title: '用户', dataIndex: 'userPhone', key: 'userPhone' },
    { title: '模型', dataIndex: 'model', key: 'model' },
    { title: '类型', dataIndex: 'mode', key: 'mode' },
    { title: '消耗积分', dataIndex: 'creditsUsed', key: 'creditsUsed' },
    { 
      title: '时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>📊 全平台使用统计（管理员）</Title>

      {/* 汇总卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="今日总消耗积分" value={stats?.today?.credits || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日总调用次数" value={stats?.today?.count || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="累计总消耗积分" value={stats?.total?.credits || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="累计总调用次数" value={stats?.total?.count || 0} />
          </Card>
        </Col>
      </Row>

      {/* 各模型使用情况 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="📈 各模型使用情况">
            <Table
              dataSource={stats?.byModel || []}
              columns={modelColumns}
              rowKey="model"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="👥 各用户使用情况">
            <Table
              dataSource={stats?.byUser || []}
              columns={userColumns}
              rowKey="phone"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 最近使用记录 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="📋 最近使用记录（20条）">
            <Table
              dataSource={stats?.recent || []}
              columns={recentColumns}
              rowKey={(record, index) => index?.toString() || ''}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}