'use client';

import React from 'react';
import { Card, Empty } from 'antd';

export default function GalleryPage() {
  return (
    <Card title="我的画廊">
      <Empty description="你还没有生成过图片，去工作台试试吧！" />
    </Card>
  );
}