'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Tabs, Input, Button, message, Avatar, Dropdown, Menu,
  Typography, Divider, Checkbox, Space, Carousel, Badge, Select, Row, Col
} from 'antd';
import {
  UserOutlined, AppstoreOutlined, HistoryOutlined, SettingOutlined,
  PhoneOutlined, QrcodeOutlined, WechatOutlined, GoogleOutlined,
  BellOutlined, SearchOutlined
} from '@ant-design/icons';
import { useSession, signIn, signOut } from 'next-auth/react';
import ImageGenerator from './components/ImageGenerator';
import { QRCodeCanvas } from 'qrcode.react';
import { ProLayout } from '@ant-design/pro-components';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationDropdown from './components/NotificationDropdown';

const { Title, Text, Paragraph } = Typography;

// ---------- 模拟数据 ----------
const mockTemplates = [
  { id: 1, name: '电商促销海报', category: '电商', image: '/templates/template1.png' },
  { id: 2, name: '产品详情页', category: '电商', image: '/templates/template2.png' },
  { id: 3, name: '社交媒体封面', category: '社交', image: '/templates/template3.png' },
  { id: 4, name: '视频封面', category: '视频', image: '/templates/template4.png' },
  { id: 5, name: '品牌宣传页', category: '品牌', image: '/templates/template5.png' },
];

// 侧边栏菜单
const menuItems = [
  { path: '/workspace', name: '首页' },
  { path: '/workspace/assets', name: '资产库' },
  { path: '/workspace/workflow', name: '工作流' },
  { path: '/workspace/pricing', name: '价目表' },
  { path: '/workspace/profile', name: '个人中心' },
];

// ---------- 主组件 ----------
export default function Workspace() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // ---------- 状态（顶层） ----------
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('qrcode');
  const [agreed, setAgreed] = useState(false);

  // 首页状态
  const [templates] = useState(mockTemplates);
  const [category, setCategory] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [credits, setCredits] = useState(150);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // ✅ 移到这里

  // 读取头像
  useEffect(() => {
    const saved = localStorage.getItem('userAvatar');
    setAvatarUrl(saved);
  }, []);

  // 读取积分
  useEffect(() => {
    const saved = localStorage.getItem('userCredits');
    if (saved) {
      setCredits(parseInt(saved));
    }
  }, []);

  // 过滤模版
  const filteredTemplates = templates.filter(item => {
    const matchCategory = category === '全部' || item.category === category;
    const matchSearch = item.name.includes(searchText);
    return matchCategory && matchSearch;
  });

  // ---------- 手机号登录 ----------
  const sendSms = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      message.warning('请输入正确的手机号');
      return;
    }
    setSmsLoading(true);
    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        message.success('验证码已发送，请查看终端输出');
      } else {
        message.error(data.message || '发送失败');
      }
    } catch {
      message.error('发送失败，请检查网络');
    } finally {
      setSmsLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone || !code) {
      message.warning('请输入手机号和验证码');
      return;
    }
    if (!agreed) {
      message.warning('请先同意服务协议');
      return;
    }
    setLoginLoading(true);
    try {
      const result = await signIn('credentials', {
        phone,
        code,
        redirect: false,
      });
      if (result?.error) {
        message.error('登录失败：' + result.error);
      } else {
        message.success('登录成功！');
        window.location.reload();
      }
    } catch {
      message.error('登录失败，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  };

  // ---------- 登出 ----------
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

  // ---------- Tab 配置（登录界面） ----------
  const tabItems = [
    {
      key: 'qrcode',
      label: <span><QrcodeOutlined /> 扫码登录</span>,
      children: (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ display: 'inline-block', background: '#fafafa', padding: 16, borderRadius: 16 }}>
            <QRCodeCanvas
              value="https://open.weixin.qq.com/connect/qrconnect?appid=wx4bc5f40df91c2d07&redirect_uri=https%3A%2F%2Fstopwatch-derived-quality.ngrok-free.dev%2Fapi%2Fauth%2Fcallback%2Fwechat&response_type=code&scope=snsapi_userinfo&state=abc123#wechat_redirect"
              size={200}
              fgColor="#000"
              bgColor="#ffffff"
            />
          </div>
          <Paragraph style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
            打开微信扫一扫登录
          </Paragraph>
        </div>
      ),
    },
    {
      key: 'phone',
      label: <span><PhoneOutlined /> 短信登录</span>,
      children: (
        <div style={{ marginTop: 16 }}>
          <Input
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            addonBefore="+86"
            size="large"
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="请输入验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              size="large"
              style={{ flex: 1 }}
            />
            <Button onClick={sendSms} loading={smsLoading} disabled={smsLoading} size="large">
              发送验证码
            </Button>
          </div>
          <div style={{ marginTop: 16 }}>
            <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
              同意 <a href="#">用户服务协议</a>、<a href="#">隐私政策</a>、<a href="#">知识产权申明</a>、<a href="#">AI服务协议</a>
            </Checkbox>
          </div>
          <Button
            type="primary"
            block
            size="large"
            onClick={handlePhoneLogin}
            loading={loginLoading}
            style={{ marginTop: 16 }}
          >
            立即登录
          </Button>
          <Divider plain style={{ marginTop: 24, fontSize: 12, color: '#ccc' }}>
            其他登录方式
          </Divider>
          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button
                shape="circle"
                icon={<WechatOutlined style={{ fontSize: 20, color: '#07C160' }} />}
                onClick={() => signIn('wechat')}
              />
              <Button
                shape="circle"
                icon={<GoogleOutlined style={{ fontSize: 20, color: '#4285F4' }} />}
                onClick={() => signIn('google', { callbackUrl: '/workspace' })}
              />
            </Space>
          </div>
        </div>
      ),
    },
  ];

  // ---------- 加载中 ----------
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  // ---------- 已登录：工作台（ProLayout） ----------
  if (session) {
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
          return <Link href={item.path || '#'}>{dom}</Link>;
        }}
        actionsRender={() => [
          <Space key="user" size="middle">
            <NotificationDropdown />
            <span style={{ fontWeight: 'bold' }}>积分: {credits}</span>
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
        <div style={{ padding: '24px' }}>
          {/* 搜索和分类 */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <Select
              defaultValue="全部"
              style={{ width: 150 }}
              onChange={(value) => setCategory(value)}
            >
              <Select.Option value="全部">全部</Select.Option>
              <Select.Option value="电商">电商</Select.Option>
              <Select.Option value="社交">社交</Select.Option>
              <Select.Option value="视频">视频</Select.Option>
              <Select.Option value="品牌">品牌</Select.Option>
            </Select>
            <Input.Search
              placeholder="搜索模版名称"
              allowClear
              style={{ width: 250 }}
              onSearch={(value) => setSearchText(value)}
            />
          </div>

          {/* 模版列表 */}
          <Row gutter={[16, 16]}>
            {filteredTemplates.map((template) => (
              <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: 180, overflow: 'hidden' }}>
                      <img
                        src={template.image}
                        alt={template.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  }
                  onClick={() => message.info(`选中模版：${template.name}`)}
                >
                  <Card.Meta title={template.name} description={template.category} />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </ProLayout>
    );
  }

  // ---------- 未登录 ----------
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', padding: '60px', gap: '60px', background: '#f0f2f5', position: 'relative' }}>
      <div style={{ flex: '0 0 60%', height: 'calc(60% - 20px)', position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
        <Carousel autoplay autoplaySpeed={4000} pauseOnHover effect="fade" style={{ height: '100%' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: '100%', width: '100%' }}>
              <img
                src={`https://picsum.photos/seed/${i}/1200/800`}
                alt={`slide ${i}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>
          ))}
        </Carousel>
      </div>

      <div style={{ flex: 1, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
        <Card bordered={false} style={{ width: '100%', maxWidth: 440, borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', padding: '32px 24px' }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} centered size="large" items={tabItems} />
          <div style={{ textAlign: 'center', marginTop: 24, color: '#aaa', fontSize: 12 }}>
            无限的增长源自无限的创意
          </div>
        </Card>
      </div>

      <div style={{ position: 'absolute', top: 10, left: 40, color: '#000000', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <h2 style={{ fontSize: 32, margin: 0 }}>Aguala</h2>
        <p style={{ fontSize: 16, opacity: 0.8 }}>一站式AI视觉创作平台</p>
      </div>
    </div>
  );
}