'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, message, Typography, Button, Input, Form, InputNumber } from 'antd';

const { Title } = Typography;

export default function UsageClient() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // ---- 积分补偿相关状态 ----
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 加载统计数据
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

  // 积分补偿提交
  const onFinishCompensation = async (values: { phone: string; credits: number; reason?: string }) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        message.success(`✅ 成功为 ${values.phone} 增加 ${values.credits} 积分`);
        form.resetFields();
        // 可选：刷新统计数据（如需立即反映变化）
        // 重新请求 /api/usage/stats 刷新
        const refreshRes = await fetch('/api/usage/stats');
        const refreshData = await refreshRes.json();
        if (!refreshData.error) setStats(refreshData);
      } else {
        message.error(data.error || '操作失败');
      }
    } catch (error) {
      message.error('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* ===== 新增：积分补偿卡片 ===== */}
      <Card 
        title="🎁 积分补偿 / 手动发放" 
        style={{ marginBottom: 24, borderColor: '#faad14' }}
        headStyle={{ backgroundColor: '#fffbe6' }}
      >
        <Form form={form} layout="vertical" onFinish={onFinishCompensation}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="phone"
                label="用户手机号"
                rules={[{ required: true, message: '请输入用户手机号' }]}
              >
                <Input placeholder="请输入注册手机号" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="credits"
                label="积分数量"
                rules={[{ required: true, message: '请输入积分数量' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="例如 200" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="reason" label="备注（可选）">
                <Input placeholder="如：充值200元补偿" />
              </Form.Item>
            </Col>
            <Col span={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button type="primary" htmlType="submit" loading={submitting} style={{ width: '100%' }}>
                发放
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* ---- 原汇总卡片 ---- */}
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

      {/* ---- 各模型/用户使用情况 ---- */}
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

      {/* ---- 最近使用记录 ---- */}
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