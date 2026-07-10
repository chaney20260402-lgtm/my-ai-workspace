'use client';

import React, { useState, useEffect } from 'react';
import { SessionProvider, useSession } from "next-auth/react";
import { ProLayout } from '@ant-design/pro-components';
import { usePathname, useRouter } from 'next/navigation';
import { Space, Avatar, Dropdown, Menu, message, Popover, Divider, List, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { signOut } from 'next-auth/react';
import './globals.css';
import NotificationDropdown from '@/app/workspace/components/NotificationDropdown';
import { getCreditRecords, CreditRecord } from '@/lib/creditRecords';
import { CreditsProvider, useCredits } from '@/app/contexts/CreditsContext';
import { App as AntdApp } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  FileOutlined,
  CreditCardOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const ADMIN_PHONE = '13929767725'; // 🔥 改成你的手机号

const baseMenuItems = [
  { 
    path: '/workspace', 
    name: '首页',
    icon: <HomeOutlined />,  // ✅ 添加图标
  },
  { 
    path: '/workspace/assets', 
    name: '模型供应商',
    icon: <AppstoreOutlined />,
  },
  { 
    path: '/workspace/workflows', 
    name: '工作流管理',
    icon: <FileOutlined />,
  },
  { 
    path: '/workspace/pricing', 
    name: '会员与积分',
    icon: <CreditCardOutlined />,
  },
  { 
    path: '/workspace/profile', 
    name: '个人中心',
    icon: <UserOutlined />,
  },
];
const adminMenuItems = [
  { 
    path: '/workspace/usage', 
    name: '使用统计',
    icon: <BarChartOutlined />,
  },
];

// ---------- 积分显示组件 ----------
function CreditDisplay() {
  const { credits } = useCredits();
  const [records, setRecords] = useState<CreditRecord[]>([]);

  useEffect(() => {
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
          {credits !== null ? credits : '加载中...'}
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
    <Popover content={popoverContent} trigger="click" placement="bottomRight" overlayStyle={{ padding: 0 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
        <span style={{ fontSize: 18 }}>🌿</span>
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>
          {credits !== null ? credits : '…'}
        </span>
      </span>
    </Popover>
  );
}

// ---------- 内部布局组件 ----------
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const menuItems = React.useMemo(() => {
    const isAdmin = session?.user?.phone === ADMIN_PHONE;
    const items = [...baseMenuItems];
    if (isAdmin) {
      items.push(...adminMenuItems);
    }
    return items;
  }, [session?.user?.phone]);
  
    useEffect(() => {
    const saved = localStorage.getItem('userAvatar');
    setAvatarUrl(saved);
  }, []);

  const handleLogout = () => {
    signOut({ callbackUrl: '/workspace' });
    message.success('已登出');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  if (status === 'loading') {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>;
  }

  const isLoginPage = pathname.startsWith('/workspace') && !session;

  if (isLoginPage) {
    return <>{children}</>;
  }

  // 恢复为原始的 ProLayout 配置（不带广告）
  return (
    <ProLayout
      title="Aguala"
      logo={false}
      layout="mix"
      fixedHeader={true}
      navTheme="light"
      colorPrimary="#101011"
      location={{ pathname }}
      route={{ routes: menuItems }}
      menuItemRender={(item, dom) => {
        if (!item.path) return dom;
        return (
          <div onClick={() => router.push(item.path as string)} style={{ cursor: 'pointer' }}>
            {dom}
          </div>
        );
      }}
      actionsRender={() => [
        <Space 
          key="user" 
          size="middle" 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            background: 'transparent !important',
            boxShadow: 'none !important',
            padding: 0,
            borderRadius: 0,
          }}
          className="no-hover"
        >
          <NotificationDropdown />
          <CreditDisplay />
          <Dropdown overlay={userMenu} placement="bottomRight">
            <Avatar
              src={avatarUrl || undefined}
              icon={!avatarUrl ? <UserOutlined /> : undefined}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        </Space>,
      ]}
    >
      {children}
    </ProLayout>
  );
}

// ---------- 根布局 ----------
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SessionProvider>
          <CreditsProvider>
            <AntdApp> 
            <LayoutContent>{children}</LayoutContent>
            </AntdApp>
          </CreditsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}