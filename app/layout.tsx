'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { ProLayout } from '@ant-design/pro-components';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Space, Avatar, Dropdown, Menu, message } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { signOut } from 'next-auth/react';
import './globals.css';

const menuItems = [
  { path: '/workspace', name: '首页' },
  { path: '/workspace/assets', name: '资产库' },
  { path: '/workspace/workflow', name: '工作流' },
  { path: '/workspace/pricing', name: '价目表' },
  { path: '/workspace/profile', name: '个人中心' },
];

// 内部布局组件，使用 useSession
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

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

  // 等待 session 加载完成
  if (status === 'loading') {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>;
  }

  // 判断是否在登录页面（未登录状态）
  const isLoginPage = pathname.startsWith('/workspace') && !session;

  // 如果是登录页面，直接渲染 children（无侧边栏）
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 已登录，显示 ProLayout
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
        <Space key="user" size="middle">
          <Badge count={5} size="small">
            <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
          </Badge>
          <span style={{ fontWeight: 'bold' }}>积分: 150</span>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </Space>,
      ]}
    >
      {children}
    </ProLayout>
  );
}

// 根布局
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SessionProvider>
          <LayoutContent>{children}</LayoutContent>
        </SessionProvider>
      </body>
    </html>
  );
}