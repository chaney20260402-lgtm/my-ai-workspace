'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // ---------- 状态 ----------
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('qrcode');
  const [agreed, setAgreed] = useState(false);

  const [templates] = useState(mockTemplates);
  const [category, setCategory] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [credits, setCredits] = useState(150);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ---------- 环绕旋转轨道动态计算 ----------
  const cardRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // ---------- Canvas 引用 ----------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nebulaCanvasRef = useRef<HTMLCanvasElement>(null);

  // ---------- 鼠标追踪波纹效果 ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let ripples: { x: number; y: number; radius: number; alpha: number }[] = [];

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 5,
        alpha: 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 1.8;
        r.alpha -= 0.015;
        if (r.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120, 180, 255, ${r.alpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 230, 255, ${r.alpha * 0.15})`;
        ctx.fill();
      }
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // ---------- 螺旋星系（一圈圈星云） ----------
  // ---------- 螺旋星系（一圈圈星云） ----------
useEffect(() => {
  const canvas = nebulaCanvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // 星云中心位置（初始默认值，后续根据卡片位置更新）
  let centerX = width * 0.85;
  let centerY = height * 0.5;

  // 更新星云中心位置，使其对齐卡片右侧
  const updateCenter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      // 卡片右侧 + 150px 偏移（可根据需要调整）
      centerX = rect.left + rect.width + 150;
      centerY = rect.top + rect.height / 2;
    } else {
      // 后备方案：屏幕右侧 85% 位置
      centerX = window.innerWidth * 0.85;
      centerY = window.innerHeight * 0.5;
    }
  };

  // 初次计算
  updateCenter();

  // 旋臂数量
  const armCount = 4;
  const particlesPerArm = 2000;
  const dustCount = 1200;

  const particles: {
    radius: number;
    angle: number;
    armIndex: number;
    offset: number;
    size: number;
    hue: number;
    brightness: number;
    alpha: number;
    isDust: boolean;
  }[] = [];

  // 生成旋臂粒子（半径范围适当缩小，以适应屏幕）
  for (let arm = 0; arm < armCount; arm++) {
    const armAngleOffset = (arm / armCount) * Math.PI * 2;
    for (let i = 0; i < particlesPerArm; i++) {
      const t = i / particlesPerArm;
      const radius = 40 + t * t * 800; // 最大半径 840（可根据视觉效果调整）
      const spiralAngle = radius * 0.025;
      const randomOffset = (Math.random() - 0.5) * (40 + t * 60);
      const angle = armAngleOffset + spiralAngle + randomOffset / radius;
      const size = 0.5 + (1 - t) * 2.5 + Math.random() * 0.8;
      const hue = 40 + t * 200;
      const brightness = 60 + (1 - t) * 50;
      const alpha = 0.5 + Math.random() * 0.5;
      particles.push({
        radius,
        angle,
        armIndex: arm,
        offset: randomOffset,
        size,
        hue,
        brightness,
        alpha,
        isDust: false,
      });
    }
  }

  // 生成星云尘埃
  for (let i = 0; i < dustCount; i++) {
    const radius = 100 + Math.random() * 700;
    const angle = Math.random() * Math.PI * 2;
    const size = 4 + Math.random() * 10;
    const hue = 200 + Math.random() * 60;
    const brightness = 25 + Math.random() * 40;
    particles.push({
      radius,
      angle,
      armIndex: -1,
      offset: 0,
      size,
      hue,
      brightness,
      alpha: 0.12 + Math.random() * 0.2,
      isDust: true,
    });
  }

  // 背景星点
  const stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = [];
  for (let i = 0; i < 1500; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      alpha: 0.2 + Math.random() * 0.6,
      twinkleSpeed: 0.005 + Math.random() * 0.02,
    });
  }

  let rotation = 0;
  let time = 0;

  const animate = () => {
    ctx.clearRect(0, 0, width, height);

    // 背景星点
    time += 0.02;
    for (const star of stars) {
      const alpha = star.alpha + Math.sin(time * star.twinkleSpeed) * 0.2;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
      ctx.fill();
    }

    // 星云光晕（使用当前中心）
    const grad = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, 700
    );
    grad.addColorStop(0, 'rgba(255, 230, 200, 0.05)');
    grad.addColorStop(0.3, 'rgba(200, 160, 255, 0.04)');
    grad.addColorStop(0.7, 'rgba(100, 100, 255, 0.02)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    rotation += 0.00015;

    // 绘制尘埃
    for (const p of particles) {
      if (!p.isDust) continue;
      const currentAngle = p.angle + rotation * 0.8;
      const x = Math.cos(currentAngle) * p.radius + centerX;
      const y = Math.sin(currentAngle) * p.radius + centerY;
      if (x < 0 || x > width || y < 0 || y > height) continue;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 60%, ${p.brightness}%, ${p.alpha})`;
      ctx.fill();
    }

    // 绘制旋臂粒子
    for (const p of particles) {
      if (p.isDust) continue;
      const currentAngle = p.angle + rotation * 1.0;
      const x = Math.cos(currentAngle) * p.radius + centerX;
      const y = Math.sin(currentAngle) * p.radius + centerY;
      if (x < 0 || x > width || y < 0 || y > height) continue;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 85%, ${p.brightness}%, ${p.alpha})`;
      ctx.fill();
    }

    // 核心星团
    for (let i = 0; i < 300; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 60;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const bright = 180 + Math.random() * 75;
      const size = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(40, 100%, ${bright}%, 0.9)`;
      ctx.fill();
    }

    requestAnimationFrame(animate);
  };
  animate();

  // 监听窗口大小变化并更新中心位置
  const handleResize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    updateCenter();
  };
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, [cardRef]); // 注意：将 cardRef 加入依赖，以便 ref 变化时重新执行（但 ref 变化不触发，实际靠 resize 更新）

  // ---------- 计算卡片偏移 ----------
  useEffect(() => {
    const updateOffset = () => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const pageCenterX = window.innerWidth / 2;
        const pageCenterY = window.innerHeight / 2;
        setOffset({
          x: cardCenterX - pageCenterX,
          y: cardCenterY - pageCenterY,
        });
      }
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, []);

  // ---------- 环绕旋转图标 ----------
  const icons = [
    { name: 'GPT', color: '#74aa9c' },
    { name: 'MJ', color: '#a97bcc' },
    { name: 'SD', color: '#f472b6' },
    { name: 'DALL-E', color: '#60a5fa' },
    { name: 'Krea', color: '#facc15' },
    { name: 'Lexica', color: '#fb923c' },
  ];

  // 读取头像
  useEffect(() => {
    const saved = localStorage.getItem('userAvatar');
    setAvatarUrl(saved);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('userCredits');
    if (saved) {
      setCredits(parseInt(saved));
    }
  }, []);

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

  // ---------- Tab 配置 ----------
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

  // ---------- 已登录 ----------
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
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 50%, #0a0a1a, #050510)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Canvas 动态背景（波纹） */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* 螺旋星系（一圈圈星云） */}
      <canvas
        ref={nebulaCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      {/* 环绕旋转图标 */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '20%',
          width: 1000,
          height: 1000,
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
          pointerEvents: 'none',
          zIndex: 6,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            animation: 'spin 25s linear infinite',
          }}
        >
          {icons.map((icon, index) => {
            const angle = (index / icons.length) * 360;
            return (
              <div
                key={icon.name}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateY(-200px)`,
                  color: icon.color,
                  fontSize: 18,
                  fontWeight: 'bold',
                  textShadow: `0 0 30px ${icon.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  letterSpacing: '0.5px',
                }}
              >
                {icon.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* 登录卡片 */}
      <div
        ref={cardRef}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '440px',
          maxWidth: '92vw',
          padding: '40px 36px',
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            color: '#fff',
            fontSize: '28px',
            fontWeight: 600,
            marginBottom: 4,
            letterSpacing: '1px',
          }}
        >
          Aguala
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 20,
            fontSize: '14px',
          }}
        >
          登录以访问您的AI工作流
        </p>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          size="large"
          items={tabItems}
          className="login-tabs"
        />

        <div style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          无限的增长源自无限的创意
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .login-tabs .ant-tabs-tab {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .login-tabs .ant-tabs-tab-active {
          color: #fff !important;
        }
        .login-tabs .ant-tabs-ink-bar {
          background: #6c5ce7 !important;
        }
        .login-tabs .ant-tabs-tab:hover {
          color: #fff !important;
        }
        .login-tabs .ant-input,
        .login-tabs .ant-input-affix-wrapper {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #fff !important;
          border-radius: 12px !important;
        }
        .login-tabs .ant-input::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        .login-tabs .ant-input-group-addon {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: rgba(255, 255, 255, 0.6) !important;
          border-radius: 12px 0 0 12px !important;
        }
        .login-tabs .ant-checkbox-wrapper {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .login-tabs .ant-checkbox-wrapper a {
          color: #a29bfe !important;
        }
        .login-tabs .ant-divider {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .login-tabs .ant-divider-inner-text {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        .login-tabs .ant-btn-default {
          color: rgba(255, 255, 255, 0.6) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .login-tabs .ant-btn-default:hover {
          color: #fff !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .login-tabs .ant-btn-primary {
          background: linear-gradient(135deg, #6c5ce7, #a29bfe) !important;
          border: none !important;
          border-radius: 12px !important;
        }
        .login-tabs .ant-btn-primary:hover {
          opacity: 0.85 !important;
        }
        .login-tabs .ant-btn-circle {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .login-tabs .ant-btn-circle:hover {
          background: rgba(255, 255, 255, 0.12) !important;
        }
        .login-tabs::-webkit-scrollbar {
          width: 4px;
        }
        .login-tabs::-webkit-scrollbar-track {
          background: transparent;
        }
        .login-tabs::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}