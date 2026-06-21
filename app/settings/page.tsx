'use client';

import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function SettingsPage() {
  return (
    <Card title="设置">
      <Title level={4}>账户设置</Title>
      <Paragraph>这里将来可以放置用户偏好、API 配置等功能。</Paragraph>
    </Card>
  );
}