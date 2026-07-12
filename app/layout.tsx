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
import { OpenAI, Claude, Gemini, DeepSeek, Qwen } from '@lobehub/icons';
import { WorkflowProvider, useWorkflow } from '@/app/contexts/WorkflowContext';
import { Modal } from 'antd';

const { Text } = Typography;
const ADMIN_PHONE = '13929767725';

const baseMenuItems = [
  { 
    path: '/workspace', 
    name: '首页',
    icon: <HomeOutlined />,
  },
  { 
    path: '/workspace/assets', 
    name: '模型供应商',
    icon: <AppstoreOutlined />,
  },
  { 
    path: '/workspace/workflow',  // 改为 generate
    name: '图片工作流',
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

  // 从 WorkflowContext 获取状态
  const { hasUnsavedChanges, setHasUnsavedChanges, saveWorkflow, navigateAfterSave } = useWorkflow();

  // ✅ 动态菜单
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

  // ✅ 广告内容（使用 LobeHub 图标）
  const adContent = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px 18px',
      flexWrap: 'wrap',
      padding: '0 16px',
    }}>
      {[
        { name: 'OpenAI', icon: OpenAI, color: '#10a37f' },
        { name: 'Claude', icon: Claude, color: '#d97706' },
        { name: 'Gemini', icon: Gemini, color: '#4285f4' },
        { name: 'Grok', icon: null, color: '#ff6b35' },
        { name: 'DeepSeek', icon: DeepSeek, color: '#4f46e5' },
        { name: 'Qwen', icon: Qwen, color: '#ff6b00' },
      ].map((model) => {
        const IconComponent = model.icon;
        return (
          <div
            key={model.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0, 0, 0, 0.04)',
              padding: '1px 12px 1px 6px',
              borderRadius: 20,
              whiteSpace: 'nowrap',
              cursor: 'default',
            }}
          >
            {IconComponent ? (
              <IconComponent size={18} color={model.color} />
            ) : (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: model.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {model.name[0]}
              </div>
            )}
            <span style={{ fontSize: 12, fontWeight: 500 }}>{model.name}</span>
          </div>
        );
      })}
    </div>
  );

  // ✅ 自定义顶部栏
  const customHeaderRender = () => {
    console.log('📝 session.user:', session?.user);
    console.log('📝 membershipType:', session?.user?.membershipType);
     const membershipType = session?.user?.membershipType || 'experience';
  const membershipLabel = {
    experience: '体验会员',
    advanced: '进阶会员',
    professional: '专业会员',
  }[membershipType] || '体验会员';

  const membershipColor = {
    experience: '#000000',
    advanced: '#1890ff',
    professional: '#faad14',
  }[membershipType] || '#ffffff';
  // ✅ 添加 return
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '0 16px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
        <span style={{ fontSize: 26, fontWeight: 600, whiteSpace: 'nowrap' }}>Aguala</span>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {adContent}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <NotificationDropdown />
        <CreditDisplay />
        <Dropdown overlay={userMenu} placement="bottomRight">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Avatar
              src={avatarUrl || undefined}
              icon={!avatarUrl ? <UserOutlined /> : undefined}
            />
            <span style={{ color: '#381111', fontSize: 14, fontWeight: 500 }}>
              {session?.user?.phone || '用户'}
            </span>
            <span
              style={{
                color: membershipColor,
                fontSize: 12,
                fontWeight: 500,
                marginLeft: 4,
                padding: '0px 10px',
                borderRadius: 12,
                border: `1px solid ${membershipColor}`,
                backgroundColor: `${membershipColor}50`,
              }}
            >
              {membershipLabel}
            </span>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

  if (status === 'loading') {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>;
  }

  const isLoginPage = pathname.startsWith('/workspace') && !session;

  if (isLoginPage) {
    return <>{children}</>;
  }

  // ✅ 用 WorkflowProvider 包裹 ProLayout
  return (
    <WorkflowProvider>
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

          const handleClick = () => {
            if (pathname === '/workspace/generate' && hasUnsavedChanges) {
              Modal.confirm({
                title: '提示',
                content: '您有未保存的工作流，是否保存后再离开？',
                okText: '保存并离开',
                cancelText: '不保存直接离开',
                onOk: async () => {
  if (saveWorkflow) {
    await saveWorkflow();
  }
  if (navigateAfterSave) {
    navigateAfterSave();
  } else {
    router.push(item.path as string);
  }
  setHasUnsavedChanges(false);
},
              });
            } else {
              router.push(item.path as string);
            }
          };

          return (
            <div onClick={handleClick} style={{ cursor: 'pointer' }}>
              {dom}
            </div>
          );
        }}
        headerRender={customHeaderRender}
      >
        {children}
      </ProLayout>
    </WorkflowProvider>
  );
}

// ---------- 根布局 ----------
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <SessionProvider>
          <CreditsProvider>
            <WorkflowProvider>        {/* ✅ 放在这里 */}
              <AntdApp>
                <LayoutContent>{children}</LayoutContent>
              </AntdApp>
            </WorkflowProvider>
          </CreditsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}