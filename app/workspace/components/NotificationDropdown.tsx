'use client';

import { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Typography, Empty, message } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Notification {
  id: number;
  type: 'success' | 'info' | 'warning';
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

const mockNotifications: Notification[] = [
  { id: 1, type: 'success', title: '充值成功', content: '充值 100 积分到账', read: false, createdAt: new Date().toISOString() },
  { id: 2, type: 'info', title: '图片生成完成', content: '您生成的图片已保存到资产库', read: false, createdAt: new Date().toISOString() },
];

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      setNotifications(mockNotifications);
      localStorage.setItem('notifications', JSON.stringify(mockNotifications));
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
    message.success('已全部标记为已读');
  };

  const menu = (
    <div style={{ width: 360, maxHeight: 400, overflowY: 'auto' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>通知</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllAsRead}>
            全部已读
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <Empty description="暂无通知" />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{ background: item.read ? 'transparent' : '#f6f8fa', cursor: 'pointer' }}
              onClick={() => markAsRead(item.id)}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong={!item.read}>{item.title}</Text>
                    {!item.read && <Badge dot color="blue" />}
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary">{item.content}</Text>
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
    <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
      <Badge count={unreadCount} size="small" offset={[-4, 4]}>
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
}