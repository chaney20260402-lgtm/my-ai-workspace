'use client';

import React, { useState, useEffect } from 'react';
import { Popover, Divider, List, Typography } from 'antd';
import { getCreditRecords, CreditRecord } from '@/lib/creditRecords';

const { Text } = Typography;

export default function CreditDisplay() {
  const [credits, setCredits] = useState(150);
  const [records, setRecords] = useState<CreditRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('userCredits');
    if (saved) setCredits(parseInt(saved));
    const recordsData = getCreditRecords();
    setRecords(recordsData);
  }, []);

  const totalRecords = records.length;
  const totalConsumed = records
    .filter(r => r.type === 'consume')
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const totalEarned = records
    .filter(r => r.type === 'recharge')
    .reduce((sum, r) => sum + r.amount, 0);

  const popoverContent = (
    <div style={{ width: 280 }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 16 }}>积分余额</Text>
        <div style={{ fontSize: 28, color: '#1677ff', fontWeight: 'bold' }}>
          {credits}
        </div>
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <List
        size="small"
        dataSource={[
          { label: '所有记录', value: totalRecords },
          { label: '已消耗', value: totalConsumed },
          { label: '已获得', value: totalEarned },
        ]}
        renderItem={(item) => (
          <List.Item style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{item.label}</span>
            <span style={{ fontWeight: 'bold' }}>{item.value}</span>
          </List.Item>
        )}
      />
    </div>
  );

  return (
  <Popover content={popoverContent} trigger="click" placement="bottomRight">
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
      <span style={{ fontSize: 18 }}>🌿</span>
      <span style={{ fontWeight: 'bold', fontSize: 14 }}>{credits}</span>
    </span>
  </Popover>
);
}