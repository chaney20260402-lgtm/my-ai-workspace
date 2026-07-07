'use client';

import { useState, useEffect } from 'react';
import { Dropdown, Badge, Empty, Typography, Space, Divider, Button, Tag, message } from 'antd';
import { 
  BellOutlined, 
  CheckOutlined, 
  DeleteOutlined, 
  InfoCircleOutlined,
  NotificationOutlined,
  WalletOutlined,
  FileOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'credit' | 'workflow' | 'system';
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 模拟加载通知数据
    const mockNotifications: Notification[] = [
      {
        id: 1,
        title: '积分奖励到账',
        message: '您通过完成 "电商主图生成" 任务获得了 20 积分',
        time: '2024-01-15 14:30',
        read: false,
        type: 'credit',
      },
      {
        id: 2,
        title: '工作流已保存',
        message: '工作流 "夏季促销主图" 已成功保存到您的列表',
        time: '2024-01-15 10:20',
        read: false,
        type: 'workflow',
      },
      {
        id: 3,
        title: '系统更新通知',
        message: 'AI 绘图引擎已升级至 v3.0，生成速度提升 40%',
        time: '2024-01-14 22:00',
        read: false,
        type: 'system',
      },
      {
        id: 4,
        title: '积分消耗提醒',
        message: '您生成了一张 4K 高清图片，消耗 8 积分',
        time: '2024-01-14 16:45',
        read: true,
        type: 'info',
      },
      {
        id: 5,
        title: '会员权益更新',
        message: 'Pro 会员新增了 MidJourney V8.1 模型使用权',
        time: '2024-01-13 09:00',
        read: true,
        type: 'success',
      },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  // 获取通知图标
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'credit':
        return <WalletOutlined style={{ color: '#faad14', fontSize: 18 }} />;
      case 'workflow':
        return <FileOutlined style={{ color: '#1677ff', fontSize: 18 }} />;
      case 'system':
        return <NotificationOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
      case 'success':
        return <CheckOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
      case 'warning':
        return <InfoCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 18 }} />;
    }
  };

  // 获取通知类型标签颜色
  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'credit': return '#faad14';
      case 'workflow': return '#1677ff';
      case 'system': return '#52c41a';
      case 'success': return '#52c41a';
      case 'warning': return '#faad14';
      default: return '#1677ff';
    }
  };

  // 标记全部已读
  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    message.success('已标记全部已读');
  };

  // 标记单条已读
  const handleMarkRead = (id: number) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
  };

  // 删除通知
  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    message.success('已删除');
  };

  // 清空所有通知
  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    message.success('已清空所有通知');
  };

  // 构建下拉菜单内容
  const menuContent = (
    <div style={{ 
      width: 420, 
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 480,
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      overflow: 'hidden',
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0,
      }}>
        <Space>
          <BellOutlined style={{ fontSize: 18, color: '#1677ff' }} />
          <Text strong style={{ fontSize: 16 }}>通知中心</Text>
          {unreadCount > 0 && (
            <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
          )}
        </Space>
        <Space size={8}>
          {unreadCount > 0 && (
            <Button 
              type="text" 
              size="small" 
              icon={<CheckOutlined />}
              onClick={handleMarkAllRead}
              style={{ color: '#1677ff' }}
            >
              全部已读
            </Button>
          )}
          {notifications.length > 0 && (
            <Button 
              type="text" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
              onClick={handleClearAll}
            >
              清空
            </Button>
          )}
        </Space>
      </div>

      {/* 通知列表 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0',
      }}>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && handleMarkRead(notif.id)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: notif.read ? 'transparent' : 'rgba(22, 119, 255, 0.04)',
                borderLeft: `3px solid ${notif.read ? 'transparent' : getTypeColor(notif.type)}`,
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = notif.read ? '#f5f5f5' : 'rgba(22, 119, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(22, 119, 255, 0.04)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* 图标 */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: `${getTypeColor(notif.type)}15`,
                }}>
                  {getNotificationIcon(notif.type)}
                </div>

                {/* 内容 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    gap: 8,
                  }}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 2 }}>
                        {notif.title}
                        {!notif.read && (
                          <span style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#1677ff',
                            marginLeft: 8,
                          }} />
                        )}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 13, display: 'block', lineHeight: 1.5 }}>
                        {notif.message}
                      </Text>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => handleDelete(notif.id, e)}
                      style={{ 
                        color: '#bfbfbf',
                        padding: '0 4px',
                        height: 24,
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4d4f'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#bfbfbf'; }}
                    />
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginTop: 4,
                  }}>
                    <ClockCircleOutlined style={{ fontSize: 12, color: '#bfbfbf' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {notif.time}
                    </Text>
                    <Tag 
                      color={getTypeColor(notif.type)}
                      style={{ 
                        fontSize: 10, 
                        padding: '0 6px', 
                        lineHeight: '18px',
                        borderRadius: 4,
                        border: 'none',
                      }}
                    >
                      {notif.type}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px 20px' }}>
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary" style={{ fontSize: 14 }}>
                  暂无通知，保持专注继续创作吧 ✨
                </Text>
              }
            />
          </div>
        )}
      </div>

      {/* 底部 */}
      {notifications.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            共 {notifications.length} 条通知，{unreadCount} 条未读
          </Text>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => menuContent}
      trigger={['click']}
      placement="bottomRight"
      overlayStyle={{ 
        padding: 0, 
        minWidth: 320,
      }}
    >
      <Badge 
        count={unreadCount} 
        size="small"
        offset={[-4, 4]}
        style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <BellOutlined 
          style={{ 
            fontSize: 20, 
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            padding: '4px',
            borderRadius: '50%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(22, 119, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        />
      </Badge>
    </Dropdown>
  );
}