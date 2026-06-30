'use client';

import { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Typography, Empty, Spin, message } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface CreditRecord {
  amount: number;
  type: 'consume' | 'recharge';
  description: string;
  createdAt: string;
}

export default function NotificationDropdown() {
  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // 从 API 获取积分记录
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/credit-records?limit=30');
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
      } else {
        console.error('获取积分记录失败:', data.error);
        message.error('获取积分记录失败');
      }
    } catch (error) {
      console.error('获取积分记录异常:', error);
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 点击铃铛时加载数据
  useEffect(() => {
    if (visible) {
      fetchRecords();
    }
  }, [visible]);

  // 计算未读数量（此处我们用总记录数作为红点提示，也可以改为新记录数）
  // 简单起见，如果有记录就显示小圆点（表示有积分变动），不显示具体数字
  const hasRecords = records.length > 0;

  // 下拉内容
  const menu = (
    <div style={{ 
      width: 360, 
      maxHeight: 400, 
      overflow: 'auto', 
      background: '#fff', 
      borderRadius: 8, 
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '4px 0'
    }}>
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Text strong>积分变动</Text>
        <Button 
          type="link" 
          size="small" 
          onClick={() => { 
            fetchRecords(); 
            message.success('已刷新');
          }}
        >
          刷新
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
        </div>
      ) : records.length === 0 ? (
        <Empty description="暂无积分变动" style={{ padding: '20px 0' }} />
      ) : (
        <List
          dataSource={records}
          renderItem={(item) => (
            <List.Item style={{ padding: '12px 16px' }}>
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>
                      {item.type === 'consume' ? '消耗' : '充值'}
                    </Text>
                    <Text style={{ color: item.amount < 0 ? '#ff4d4f' : '#52c41a' }}>
                      {item.amount > 0 ? `+${item.amount}` : item.amount}
                    </Text>
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary">{item.description || ''}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={menu}
      trigger={['click']}
      placement="bottomRight"
      open={visible}
      onOpenChange={(open) => setVisible(open)}
    >
      <Badge dot={hasRecords} size="small" offset={[-4, 4]}>
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
}