'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Tabs, Input, Button, message, Avatar, Dropdown, Menu,
  Typography, Divider, Checkbox, Space, Carousel, Badge, Select, Row, Col,
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

import CreditDisplay from './components/CreditDisplay';

const { Title, Text, Paragraph } = Typography;


// ---------- 模拟数据 ----------
const mockTemplates = [
  { id: 1, name: '男装 夏季T恤', category: '潮流服饰', image: 'https://picsum.photos/seed/cloth1/400/300' },
  { id: 2, name: '女装 连衣裙', category: '潮流服饰', image: 'https://picsum.photos/seed/cloth2/400/300' },
  { id: 3, name: '女装 秋冬外套', category: '潮流服饰', image: 'https://picsum.photos/seed/cloth3/400/300' },
  { id: 4, name: '男装 休闲西装', category: '潮流服饰', image: 'https://picsum.photos/seed/cloth4/400/300' },
  { id: 5, name: '内衣 舒适家居服', category: '潮流服饰', image: 'https://picsum.photos/seed/cloth5/400/300' },
  { id: 6, name: '运动服饰 瑜伽服', category: '潮流服饰', image: 'https://picsum.photos/seed/cloth6/400/300' },
  { id: 7, name: '运动服饰 跑步鞋', category: '潮流服饰', image: 'https://picsum.photos/seed/cloth7/400/300' },
  { id: 8, name: '童装 儿童套装', category: '潮流服饰', image: 'https://picsum.photos/seed/cloth8/400/300' },

  // 鞋靴箱包 (6)
  { id: 9, name: '男鞋 商务皮鞋', category: '鞋靴箱包', image: 'https://picsum.photos/seed/shoe1/400/300' },
  { id: 10, name: '女鞋 高跟鞋', category: '鞋靴箱包', image: 'https://picsum.photos/seed/shoe2/400/300' },
  { id: 11, name: '童鞋 运动鞋', category: '鞋靴箱包', image: 'https://picsum.photos/seed/shoe3/400/300' },
  { id: 12, name: '手提包 时尚女包', category: '鞋靴箱包', image: 'https://picsum.photos/seed/bag1/400/300' },
  { id: 13, name: '钱包 男士钱包', category: '鞋靴箱包', image: 'https://picsum.photos/seed/bag2/400/300' },
  { id: 14, name: '旅行箱 登机箱', category: '鞋靴箱包', image: 'https://picsum.photos/seed/bag3/400/300' },

  // 数码家电 (8)
  { id: 15, name: '手机 智能手机', category: '数码家电', image: 'https://picsum.photos/seed/elec1/400/300' },
  { id: 16, name: '电脑 笔记本电脑', category: '数码家电', image: 'https://picsum.photos/seed/elec2/400/300' },
  { id: 17, name: '相机 单反相机', category: '数码家电', image: 'https://picsum.photos/seed/elec3/400/300' },
  { id: 18, name: '电视机 4K电视', category: '数码家电', image: 'https://picsum.photos/seed/elec4/400/300' },
  { id: 19, name: '冰箱 双开门冰箱', category: '数码家电', image: 'https://picsum.photos/seed/elec5/400/300' },
  { id: 20, name: '洗衣机 滚筒洗衣机', category: '数码家电', image: 'https://picsum.photos/seed/elec6/400/300' },
  { id: 21, name: '平板电脑', category: '数码家电', image: 'https://picsum.photos/seed/elec7/400/300' },
  { id: 22, name: '耳机 无线耳机', category: '数码家电', image: 'https://picsum.photos/seed/elec8/400/300' },

  // 美妆个护 (6)
  { id: 23, name: '护肤品 精华液', category: '美妆个护', image: 'https://picsum.photos/seed/beauty1/400/300' },
  { id: 24, name: '护肤品 面霜', category: '美妆个护', image: 'https://picsum.photos/seed/beauty2/400/300' },
  { id: 25, name: '彩妆 口红', category: '美妆个护', image: 'https://picsum.photos/seed/beauty3/400/300' },
  { id: 26, name: '彩妆 粉底液', category: '美妆个护', image: 'https://picsum.photos/seed/beauty4/400/300' },
  { id: 27, name: '香水 经典香水', category: '美妆个护', image: 'https://picsum.photos/seed/beauty5/400/300' },
  { id: 28, name: '个人洗护 洗发水', category: '美妆个护', image: 'https://picsum.photos/seed/beauty6/400/300' },

  // 珠宝首饰 (5)
  { id: 29, name: '黄金 项链', category: '珠宝首饰', image: 'https://picsum.photos/seed/jewel1/400/300' },
  { id: 30, name: '钻石 钻戒', category: '珠宝首饰', image: 'https://picsum.photos/seed/jewel2/400/300' },
  { id: 31, name: '玉石 手镯', category: '珠宝首饰', image: 'https://picsum.photos/seed/jewel3/400/300' },
  { id: 32, name: '手表 男士腕表', category: '珠宝首饰', image: 'https://picsum.photos/seed/jewel4/400/300' },
  { id: 33, name: '饰品 耳环', category: '珠宝首饰', image: 'https://picsum.photos/seed/jewel5/400/300' },

  // 母婴玩具 (4)
  { id: 34, name: '奶粉 婴儿奶粉', category: '母婴玩具', image: 'https://picsum.photos/seed/baby1/400/300' },
  { id: 35, name: '婴儿用品 婴儿车', category: '母婴玩具', image: 'https://picsum.photos/seed/baby2/400/300' },
  { id: 36, name: '童装 婴儿连体衣', category: '母婴玩具', image: 'https://picsum.photos/seed/baby3/400/300' },
  { id: 37, name: '玩具 儿童积木', category: '母婴玩具', image: 'https://picsum.photos/seed/baby4/400/300' },

  // 食品酒饮 (6)
  { id: 38, name: '零食 坚果礼盒', category: '食品酒饮', image: 'https://picsum.photos/seed/food1/400/300' },
  { id: 39, name: '生鲜 水果礼盒', category: '食品酒饮', image: 'https://picsum.photos/seed/food2/400/300' },
  { id: 40, name: '酒水 红酒', category: '食品酒饮', image: 'https://picsum.photos/seed/food3/400/300' },
  { id: 41, name: '饮料 高端茶饮', category: '食品酒饮', image: 'https://picsum.photos/seed/food4/400/300' },
  { id: 42, name: '保健品 维生素', category: '食品酒饮', image: 'https://picsum.photos/seed/food5/400/300' },
  { id: 43, name: '特色美食 地方特产', category: '食品酒饮', image: 'https://picsum.photos/seed/food6/400/300' },

  // 家居生活 (6)
  { id: 44, name: '家具 简约沙发', category: '家居生活', image: 'https://picsum.photos/seed/home1/400/300' },
  { id: 45, name: '家纺 床上四件套', category: '家居生活', image: 'https://picsum.photos/seed/home2/400/300' },
  { id: 46, name: '厨具 不粘锅', category: '家居生活', image: 'https://picsum.photos/seed/home3/400/300' },
  { id: 47, name: '日用品 收纳箱', category: '家居生活', image: 'https://picsum.photos/seed/home4/400/300' },
  { id: 48, name: '家装建材 灯具', category: '家居生活', image: 'https://picsum.photos/seed/home5/400/300' },
  { id: 49, name: '家居装饰 花瓶', category: '家居生活', image: 'https://picsum.photos/seed/home6/400/300' },

  // 运动户外 (4)
  { id: 50, name: '运动鞋服 冲锋衣', category: '运动户外', image: 'https://picsum.photos/seed/sport1/400/300' },
  { id: 51, name: '健身器材 哑铃', category: '运动户外', image: 'https://picsum.photos/seed/sport2/400/300' },
  { id: 52, name: '户外装备 帐篷', category: '运动户外', image: 'https://picsum.photos/seed/sport3/400/300' },
  { id: 53, name: '运动护具 护膝', category: '运动户外', image: 'https://picsum.photos/seed/sport4/400/300' },

  // 汽车用品 (3)
  { id: 54, name: '汽车配件 轮胎', category: '汽车用品', image: 'https://picsum.photos/seed/car1/400/300' },
  { id: 55, name: '车载电子产品 行车记录仪', category: '汽车用品', image: 'https://picsum.photos/seed/car2/400/300' },
  { id: 56, name: '汽车养护品 机油', category: '汽车用品', image: 'https://picsum.photos/seed/car3/400/300' },

  // 图书音像 (3)
  { id: 57, name: '书籍 小说', category: '图书音像', image: 'https://picsum.photos/seed/book1/400/300' },
  { id: 58, name: '书籍 技术类', category: '图书音像', image: 'https://picsum.photos/seed/book2/400/300' },
  { id: 59, name: '音像制品 唱片', category: '图书音像', image: 'https://picsum.photos/seed/book3/400/300' },

  // 虚拟商品 (3)
  { id: 60, name: '游戏点卡 充值', category: '虚拟商品', image: 'https://picsum.photos/seed/virtual1/400/300' },
  { id: 61, name: '软件 正版授权', category: '虚拟商品', image: 'https://picsum.photos/seed/virtual2/400/300' },
  { id: 62, name: '数字内容 电子书', category: '虚拟商品', image: 'https://picsum.photos/seed/virtual3/400/300' },
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
      contentStyle={{ padding: 0 }}
      menuItemRender={(item, dom) => {
        return <Link href={item.path || '#'}>{dom}</Link>;
      }}
      actionsRender={() => [
        <Space key="user" size="middle">
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
      <div style={{ padding: '0px 0px 0px 0px' }}>
        {/* 搜索和分类 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Select
            defaultValue="全部"
            style={{ width: 100 }}
            onChange={(value) => setCategory(value)}
          >
            <Select.Option value="全部">全部</Select.Option>
            <Select.Option value="潮流服饰">潮流服饰</Select.Option>
            <Select.Option value="鞋靴箱包">鞋靴箱包</Select.Option>
            <Select.Option value="数码家电">数码家电</Select.Option>
            <Select.Option value="美妆个护">美妆个护</Select.Option>
            <Select.Option value="珠宝首饰">珠宝首饰</Select.Option>
            <Select.Option value="母婴玩具">母婴玩具</Select.Option>
            <Select.Option value="食品酒饮">食品酒饮</Select.Option>
            <Select.Option value="家居生活">家居生活</Select.Option>
            <Select.Option value="运动户外">运动户外</Select.Option>
            <Select.Option value="汽车用品">汽车用品</Select.Option>
            <Select.Option value="图书音像">图书音像</Select.Option>
            <Select.Option value="虚拟商品">虚拟商品</Select.Option>
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