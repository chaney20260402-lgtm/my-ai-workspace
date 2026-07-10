'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,  Tabs, Input, Button, message, Avatar, Dropdown, Menu,
  Typography, Divider, Checkbox, Space, Carousel, Badge,Modal,
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
import { MailOutlined } from '@ant-design/icons';
import CreditDisplay from './components/CreditDisplay';
import { OpenAI, Claude, Gemini, DeepSeek, Qwen } from '@lobehub/icons';
import PremiumCube from './components/PremiumCube';

const { Title, Text, Paragraph } = Typography;


// ---------- 模拟数据 ----------


// 侧边栏菜单
const menuItems = [
  { path: '/workspace', name: '首页' },
  { path: '/workspace/assets', name: '模型供应商' },
  { path: '/workspace/workflow', name: '图片工作流' },
  { path: '/workspace/pricing', name: '会员与积分' },
  { path: '/workspace/profile', name: '个人中心' },
];

// ---------- 广告内容（与全局布局保持一致） ----------
const adContent = (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px 18px',
      flexWrap: 'wrap',
      padding: '0 16px',
    }}
  >
    {[
      { name: 'OpenAI', color: '#10a37f' },
      { name: 'Claude', color: '#d97706' },
      { name: 'Gemini', color: '#4285f4' },
      { name: 'Grok', color: '#ff6b35' },
      { name: 'DeepSeek', color: '#4f46e5' },
      { name: 'Qwen', color: '#ff6b00' },
    ].map((model) => (
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
        <span style={{ fontSize: 12, fontWeight: 500 }}>{model.name}</span>
      </div>
    ))}

  </div>
);

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
  const [activeTab, setActiveTab] = useState('sms');
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);

 
  
  const [credits, setCredits] = useState(150);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);


  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [passwordLoginLoading, setPasswordLoginLoading] = useState(false);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false); 
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerCode, setRegisterCode] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerCountdown, setRegisterCountdown] = useState(0);


  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);

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

  // 🎯 星云中心固定在屏幕右侧边缘，垂直居中
  const centerX = width;
  const centerY = height / 2;
  // 进一步放大半圆，使其左边界明显超过卡片位置（卡片约在屏幕 40% 位置）
  const maxRadius = Math.min(width, height) * 1.1; // 比屏幕高度还大一点

  // ---- 螺旋星系粒子（6000个） ----
  const starCount = 6000;
  const armCount = 4;
  const particles: {
    radius: number;
    angle: number;
    size: number;
    color: string;
    brightness: number;
  }[] = [];

  for (let i = 0; i < starCount; i++) {
    const armIndex = i % armCount;
    const armAngleOffset = (armIndex / armCount) * Math.PI * 2;

    const t = Math.random();
    const radius = 30 + t * t * maxRadius;
    const spiralAngle = radius * 0.03 + t * 1.5;
    const randomOffset = (Math.random() - 0.5) * (20 + t * 40);
    const angle = armAngleOffset + spiralAngle + randomOffset / radius;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.5;

    const size = 0.5 + (1 - t) * 1.5 + Math.random() * 0.5;
    const hue = 35 + t * 210;
    const sat = 80 + (1 - t) * 20;
    const lig = 60 + (1 - t) * 40;
    const alpha = 0.6 + Math.random() * 0.4;

    particles.push({
      radius: radius,
      angle: angle,
      size: size,
      color: `hsla(${hue}, ${sat}%, ${lig}%, ${alpha})`,
      brightness: lig,
    });
  }

  // ---- 星云尘埃（增大数量，更弥散） ----
  const dustCount = 5000;
  const dustParticles: {
    x: number;
    y: number;
    size: number;
    color: string;
  }[] = [];

  for (let i = 0; i < dustCount; i++) {
    const radius = 50 + Math.random() * maxRadius;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.5;
    const size = 5 + Math.random() * 20;
    const alpha = 0.02 + Math.random() * 0.06;
    const hue = 200 + Math.random() * 60;
    dustParticles.push({
      x: x,
      y: y,
      size: size,
      color: `hsla(${hue}, 50%, 50%, ${alpha})`,
    });
  }

  // ---- 小行星（球型）和陨石块 ----
  const asteroidCount = 120;
  const asteroids: {
    radius: number;
    angle: number;
    size: number;
    speed: number;
    color: string;
    offsetY: number;
    rotationAngle: number;
    rotationSpeed: number;
    type: 'sphere' | 'rock'; // 球型或陨石块
    rockPoints?: { x: number; y: number }[]; // 陨石形状点
  }[] = [];

  // 生成随机陨石形状
  function generateRockPoints(segments: number = 6): { x: number; y: number }[] {
    const points = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const radius = 0.7 + Math.random() * 0.6; // 不规则半径
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
    return points;
  }

  for (let i = 0; i < asteroidCount; i++) {
    const radius = maxRadius * (0.65 + Math.random() * 0.35);
    const angle = Math.random() * Math.PI * 2;
    const size = 2 + Math.random() * 6;
    const speed = 0.001 + Math.random() * 0.004;
    const gray = 80 + Math.random() * 120;
    const color = `rgb(${gray}, ${gray}, ${gray})`;
    const type = Math.random() > 0.5 ? 'sphere' : 'rock';
    const rockPoints = type === 'rock' ? generateRockPoints(5 + Math.floor(Math.random() * 4)) : undefined;
    asteroids.push({
      radius: radius,
      angle: angle,
      size: size,
      speed: speed,
      color: color,
      offsetY: (Math.random() - 0.5) * 35,
      rotationAngle: Math.random() * Math.PI * 2,
      rotationSpeed: 0.01 + Math.random() * 0.04,
      type: type,
      rockPoints: rockPoints,
    });
  }

  // ---- 背景恒星（3000颗） ----
  const bgStars: {
    x: number;
    y: number;
    size: number;
    baseAlpha: number;
    twinkleSpeed: number;
  }[] = [];
  for (let i = 0; i < 3000; i++) {
    bgStars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.0 + 0.5,
      baseAlpha: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.005 + Math.random() * 0.025,
    });
  }

  let rotation = 0;
  let time = 0;

  // ---- 动画循环 ----
  const animate = () => {
    ctx.clearRect(0, 0, width, height);

    // 1. 背景恒星
    time += 0.02;
    for (const star of bgStars) {
      const alpha = star.baseAlpha + Math.sin(time * star.twinkleSpeed) * 0.25;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
      ctx.fill();
    }

    // 2. 星系中心光晕
    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 0.15);
    grad.addColorStop(0, 'rgba(255, 235, 200, 0.5)');
    grad.addColorStop(0.5, 'rgba(255, 200, 150, 0.25)');
    grad.addColorStop(1, 'rgba(255, 200, 150, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(centerX - maxRadius, centerY - maxRadius, maxRadius * 2, maxRadius * 2);

    // 3. 星云尘埃
    for (const d of dustParticles) {
      const x = d.x + centerX;
      const y = d.y + centerY;
      ctx.beginPath();
      ctx.arc(x, y, d.size, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
    }

    // 4. 旋臂粒子
    rotation += 0.0002;
    for (const p of particles) {
      const currentAngle = p.angle + rotation;
      const x = Math.cos(currentAngle) * p.radius + centerX;
      const y = Math.sin(currentAngle) * p.radius * 0.5 + centerY;
      if (x < 0 || x > width || y < 0 || y > height) continue;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // 5. 小行星和陨石块
    for (const a of asteroids) {
      a.angle += a.speed;
      a.rotationAngle += a.rotationSpeed;
      const x = Math.cos(a.angle) * a.radius + centerX;
      const y = Math.sin(a.angle) * a.radius * 0.5 + centerY + a.offsetY;
      if (x < 0 || x > width || y < 0 || y > height) continue;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a.rotationAngle);

      if (a.type === 'sphere') {
        // 球型小行星（带阴影渐变）
        const grad = ctx.createRadialGradient(
          -a.size * 0.3, -a.size * 0.3, 0,
          0, 0, a.size
        );
        grad.addColorStop(0, 'rgba(255,255,255,0.3)');
        grad.addColorStop(0.5, a.color);
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.beginPath();
        ctx.arc(0, 0, a.size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // 高光
        ctx.beginPath();
        ctx.arc(-a.size * 0.2, -a.size * 0.2, a.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();
      } else {
        // 陨石块（不规则多边形）
        if (!a.rockPoints) continue;
        ctx.beginPath();
        const pts = a.rockPoints;
        const scale = a.size;
        ctx.moveTo(pts[0].x * scale, pts[0].y * scale);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * scale, pts[i].y * scale);
        }
        ctx.closePath();
        // 填充颜色（加些随机变化）
        ctx.fillStyle = a.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // 加一些小亮点模拟岩石纹理
        ctx.beginPath();
        ctx.arc(pts[0].x * scale * 0.5, pts[0].y * scale * 0.5, scale * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
      }
      ctx.restore();
    }

    // 6. 辉光
    const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 0.6);
    glowGrad.addColorStop(0, 'rgba(255, 220, 180, 0.12)');
    glowGrad.addColorStop(0.5, 'rgba(200, 150, 255, 0.06)');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(centerX - maxRadius, centerY - maxRadius, maxRadius * 2, maxRadius * 2);

    // 7. 雾效
    const fogGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 1.2);
    fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
    fogGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, width, height);

    requestAnimationFrame(animate);
  };
  animate();

  const handleResize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  };
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

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

  // ---------- 手机号登录 ----------
  const sendSms = async () => {
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    message.warning('请输入正确的手机号');
    return;
  }
  if (countdown > 0) return;

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
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
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
    console.log('登录结果:', result);
    if (result?.error) {
      let errorMsg = result.error;
      if (errorMsg === 'CredentialsSignin') {
        errorMsg = '手机号或验证码错误，请重试';
      }
      message.error('登录失败：' + errorMsg);
    } else if (result?.ok) {
      message.success('登录成功！');
      window.location.reload();
    } else {
      message.error('登录失败，请稍后重试');
    }
  } catch (error) {
    console.error('登录错误:', error);
    message.error('登录失败，请稍后重试');
  } finally {
    setLoginLoading(false);
  }
};

// ---------- 密码登录 ---------- ✅ 独立定义
const handlePasswordLogin = async () => {
  if (!loginUsername || !loginPassword) {
    message.warning('请输入用户名和密码');
    return;
  }
  setPasswordLoginLoading(true);
  try {
    // TODO: 调用 NextAuth Credentials Provider
    message.info('密码登录功能开发中，请使用手机号登录');
  } catch (error) {
    console.error('登录失败:', error);
    message.error('登录失败，请重试');
  } finally {
    setPasswordLoginLoading(false);
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
    key: 'sms',
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
          <Button
            onClick={sendSms}
            loading={smsLoading}
            disabled={smsLoading || countdown > 0}
            size="large"
            className="send-code-btn"
          >
            {countdown > 0 ? `${countdown}s` : '发送验证码'}
          </Button>
        </div>
        <div style={{ marginTop: 16 }}>
          <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
            同意 <a href="#">用户服务协议</a>、<a href="#">隐私政策</a>
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
      </div>
    ),
  },
  // ---------- 用户名密码登录 ----------
 {
  key: 'password',
  label: <span><UserOutlined /> 密码登录</span>,
  children: (
    <div style={{ marginTop: 16 }}>
      <Input
        placeholder="请输入用户名/手机号"
        value={loginUsername}
        onChange={(e) => setLoginUsername(e.target.value)}
        size="large"
        style={{ marginBottom: 12 }}
      />
      <Input.Password
        placeholder="请输入密码"
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        size="large"
        className="password-input"
        style={{ marginBottom: 12 }}
      />
      <div style={{ marginTop: 16 }}>
        <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
          同意 <a href="#">用户服务协议</a>、<a href="#">隐私政策</a>
        </Checkbox>
      </div>
      <Button
        type="primary"
        block
        size="large"
        onClick={handlePasswordLogin}
        loading={passwordLoginLoading}
        style={{ marginTop: 16 }}
      >
        立即登录
      </Button>

      {/* ✅ 在这里添加注册和忘记密码链接 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <Button type="link" onClick={() => setShowRegisterModal(true)}>注册账号</Button>
        <Button type="link" onClick={() => setShowForgotPasswordModal(true)}>忘记密码</Button>
      </div>
    </div>
  ),
},
]


  // ---------- 加载中 ----------
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

 if (session) {
  // ---------- 广告内容（与全局布局保持一致） ----------
const adContent = (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px 18px',
      flexWrap: 'wrap',
      padding: '0 16px',
    }}
  >
    {[
      { name: 'OpenAI', icon: OpenAI, color: '#10a37f' },
      { name: 'Claude', icon: Claude, color: '#d97706' },
      { name: 'Gemini', icon: Gemini, color: '#4285f4' },
      // Grok 可能没有，暂时保留首字母或使用占位
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

  // ---------- 自定义顶部栏渲染 ----------
  const customHeaderRender = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '0 16px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        
        <span style={{ fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>Aguala</span>
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
            <span style={{ color: '#333', fontSize: 14, fontWeight: 500 }}>
              {session?.user?.phone || '用户'}
            </span>
          </div>
        </Dropdown>
      </div>
    </div>
  );

  return (
    <ProLayout
      logo={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <OpenAI size={24} color="#10a37f" />
      <Claude size={24} color="#d97706" />
      <Gemini size={24} color="#4285F4" />
      <DeepSeek size={24} color="#06b6d4" />
      <Qwen size={24} color="#6c5ce7" />
    </div>}
      layout="mix"
      fixedHeader={true}
      navTheme="light"
      colorPrimary="#101011"
      location={{ pathname }}
      route={{ routes: menuItems }}
      contentStyle={{ padding: 0, paddingTop: 56, margin: 0 }} // 为固定头部留空间
      menuItemRender={(item, dom) => {
        return <Link href={item.path || '#'}>{dom}</Link>;
      }}
      headerRender={customHeaderRender}   // 使用自定义头部（包含广告）
      // ⚠️ 注意：删除了 title 和 actionsRender
    >
    {/* ✅ 新内容：品牌宣传页 + 魔方 */}
      <div style={{
       height: 'calc(100vh - 56px)',   // 固定高度，不随内容变化
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  padding: '16px 24px',
  overflow: 'hidden',             // 禁止滚动
  boxSizing: 'border-box',
      }}>
        <div style={{
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 60,
          flexWrap: 'wrap',
        }}>
          {/* 左侧文字内容 */}
          <div style={{ flex: 1, minWidth: 300, color: '#fff' }}>
            {/* ... 标题、描述、按钮、功能亮点 ... */}
            {/* 品牌标签 */}
  <div style={{
    display: 'inline-block',
    background: 'rgba(0,0,0,0.04)',
    padding: '4px 16px',
    borderRadius: 20,
    marginBottom: 20,
    border: '1px solid rgba(0,0,0,0.06)',
  }}>
    <span style={{ color: '#666', fontSize: 13, fontWeight: 500, letterSpacing: '0.5px' }}>
      ✦ 智能视觉实验室
    </span>
  </div>

  {/* 主广告语 */}
  <h1 style={{
    color: '#1a1a1a',
    margin: 0,
    fontSize: 52,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: '-1px',
  }}>
    AI 让一切
    <br />
    <span style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #555 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }}>
      变成可能
    </span>
  </h1>

  {/* 副广告语 */}
  <p style={{
    color: '#555',
    fontSize: 18,
    fontWeight: 400,
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: '2px',
    fontStyle: 'italic',
  }}>
    灵感无界 · 创意即现
  </p>

  {/* 品牌描述 */}
  <p style={{
    color: '#888',
    fontSize: 15,
    lineHeight: 1.8,
    marginBottom: 28,
    maxWidth: 460,
    letterSpacing: '0.3px',
  }}>
    从文字到图像，从构想到现实。
    <br />
    用 AI 重新定义视觉表达的边界。
  </p>

  {/* CTA 按钮组 */}
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
    <button
      onClick={() => router.push('/workspace/generate')}
      style={{
        background: '#1a1a1a',
        border: 'none',
        padding: '0 36px',
        height: 48,
        borderRadius: 8,
        color: '#fff',
        fontSize: 15,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        letterSpacing: '0.5px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
    >
      立即体验
    </button>
    <button
      onClick={() => router.push('/workspace/assets')}
      style={{
        background: 'transparent',
        border: '1px solid #ccc',
        padding: '0 36px',
        height: 48,
        borderRadius: 8,
        color: '#555',
        fontSize: 15,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        letterSpacing: '0.3px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#888'; e.currentTarget.style.color = '#1a1a1a'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.color = '#555'; }}
    >
      了解详情 →
    </button>
  </div>

  {/* 底部签名 */}
  <div style={{
    color: '#bbb',
    fontSize: 12,
    letterSpacing: '1px',
    marginTop: 8,
  }}>
    Aguala · 智能视觉实验室
  </div>
          </div>

          {/* 右侧 3D 魔方 - 正中心放大 */}
<div style={{
  width: 1500,
  height: 0,
  flexShrink: 0,
  position: 'relative',
  margin: '0 auto',
}}>

  <PremiumCube />
          </div>
        </div>
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
  <Modal
  title="注册账号"
  open={showRegisterModal}
  onCancel={() => {
    setShowRegisterModal(false);
    setRegisterPhone('');
    setRegisterCode('');
    setRegisterPassword('');
    setRegisterLoading(false);
  }}
  footer={null}
  destroyOnClose
  centered
  width={420}
>
  <Input
    placeholder="请输入手机号"
    value={registerPhone}
    onChange={(e) => setRegisterPhone(e.target.value)}
    addonBefore="+86"
    size="large"
    style={{ marginBottom: 12 }}
  />
  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
    <Input
      placeholder="请输入验证码"
      value={registerCode}
      onChange={(e) => setRegisterCode(e.target.value)}
      size="large"
      style={{ flex: 1 }}
    />
    <Button
      onClick={async () => {
        if (!registerPhone || !/^1[3-9]\d{9}$/.test(registerPhone)) {
          message.warning('请输入正确的手机号');
          return;
        }
        if (registerCountdown > 0) return;

        setRegisterCountdown(60);
        try {
          const res = await fetch('/api/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: registerPhone }),
          });
          const data = await res.json();
          if (data.success) {
            message.success('验证码已发送');
            const timer = setInterval(() => {
              setRegisterCountdown((prev) => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
              });
            }, 1000);
          } else {
            message.error(data.message || '发送失败');
            setRegisterCountdown(0);
          }
        } catch {
          message.error('发送失败，请检查网络');
          setRegisterCountdown(0);
        }
      }}
      disabled={registerCountdown > 0}
      size="large"
    >
      {registerCountdown > 0 ? `${registerCountdown}s` : '获取验证码'}
    </Button>
  </div>
  <Input.Password
    placeholder="请输入密码（至少6位）"
    value={registerPassword}
    onChange={(e) => setRegisterPassword(e.target.value)}
    size="large"
    style={{ marginBottom: 12 }}
  />
  <Button
    type="primary"
    block
    size="large"
    loading={registerLoading}
    onClick={async () => {
      if (!registerPhone || !/^1[3-9]\d{9}$/.test(registerPhone)) {
        message.warning('请输入正确的手机号');
        return;
      }
      if (!registerCode) {
        message.warning('请输入验证码');
        return;
      }
      if (!registerPassword || registerPassword.length < 6) {
        message.warning('密码至少6位');
        return;
      }

      setRegisterLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: registerPhone,
            code: registerCode,
            password: registerPassword,
          }),
        });
        const data = await res.json();
        if (data.success) {
          message.success('注册成功，请登录');
          setShowRegisterModal(false);
          setRegisterPhone('');
          setRegisterCode('');
          setRegisterPassword('');
        } else {
          message.error(data.error || '注册失败');
        }
      } catch (error) {
        console.error('注册失败:', error);
        message.error('注册失败，请重试');
      } finally {
        setRegisterLoading(false);
      }
    }}
  >
    立即注册
  </Button>
  <div style={{ marginTop: 12, textAlign: 'center', color: '#999', fontSize: 12 }}>
    已有账号？<Button type="link" size="small" onClick={() => setShowRegisterModal(false)}>去登录</Button>
  </div>
</Modal>
{/* ========== 忘记密码弹窗 ========== */}
<Modal
  title="找回密码"
  open={showForgotPasswordModal}
  onCancel={() => {
    setShowForgotPasswordModal(false);
    setForgotPhone('');
    setForgotCode('');
    setForgotNewPassword('');
  }}
  footer={null}
  destroyOnClose
  centered
  width={420}
>
  <Input
    placeholder="请输入手机号"
    value={forgotPhone}
    onChange={(e) => setForgotPhone(e.target.value)}
    addonBefore="+86"
    size="large"
    style={{ marginBottom: 12 }}
  />
  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
    <Input
      placeholder="请输入验证码"
      value={forgotCode}
      onChange={(e) => setForgotCode(e.target.value)}
      size="large"
      style={{ flex: 1 }}
    />
    <Button
      onClick={async () => {
    if (!forgotPhone || !/^1[3-9]\d{9}$/.test(forgotPhone)) {
      message.warning('请输入正确的手机号');
      return;
    }
    if (forgotCountdown > 0) return;

    setForgotCountdown(60);
    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone }),
      });
      const data = await res.json();
      if (data.success) {
        message.success('验证码已发送');
        const timer = setInterval(() => {
          setForgotCountdown((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        message.error(data.message || '发送失败');
        setForgotCountdown(0);
      }
    } catch {
      message.error('发送失败，请检查网络');
      setForgotCountdown(0);
    }
  }}
  disabled={forgotCountdown > 0}
  size="large"
>
  {forgotCountdown > 0 ? `${forgotCountdown}s` : '获取验证码'}
</Button>
  </div>
  <Input.Password
    placeholder="请输入新密码（至少6位）"
    value={forgotNewPassword}
    onChange={(e) => setForgotNewPassword(e.target.value)}
    size="large"
    style={{ marginBottom: 12 }}
  />
  <Button
    type="primary"
    block
    size="large"
    loading={forgotLoading}
    onClick={async () => {
      if (!forgotPhone || !forgotCode || !forgotNewPassword) {
        message.warning('请完善所有信息');
        return;
      }
      if (forgotNewPassword.length < 6) {
        message.warning('密码至少6位');
        return;
      }
      setForgotLoading(true);
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: forgotPhone,
            code: forgotCode,
            newPassword: forgotNewPassword,
          }),
        });
        const data = await res.json();
        if (data.success) {
          message.success('密码重置成功，请登录');
          setShowForgotPasswordModal(false);
          setForgotPhone('');
          setForgotCode('');
          setForgotNewPassword('');
        } else {
          message.error(data.error || '重置失败');
        }
      } catch (error) {
        console.error('重置失败:', error);
        message.error('重置失败，请重试');
      } finally {
        setForgotLoading(false);
      }
    }}
  >
    重置密码
  </Button>
</Modal>

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
  .login-tabs .send-code-btn {
    color: #333 !important;
    background: #fff !important;
    border: 1px solid #d9d9d9 !important;
  }
  .login-tabs .send-code-btn:hover {
    color: #000 !important;
    border-color: #1677ff !important;
  }

  /* ====== 新增：密码输入框样式（保留眼睛图标，去除多余样式） ====== */
.login-tabs .password-input .ant-input {
  padding-right: 40px !important; /* 为眼睛图标留出空间，但输入区域从左边开始正常 */
  width: 100% !important;
  background: transparent !important;
  border: none !important;
}

/* 确保外层容器和内层输入框的宽度一致 */
.login-tabs .password-input,
.login-tabs .password-input.ant-input-affix-wrapper {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px !important;
  box-shadow: none !important;
  outline: none !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 12px !important; /* 与普通输入框的内边距一致 */
}

/* 内部的 input 占满剩余宽度 */
.login-tabs .password-input .ant-input {
  flex: 1 !important;
  min-width: 0 !important;
  padding: 8px 0 !important; /* 调整上下内边距，与用户名一致 */
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  color: #fff !important;
}

/* 眼睛图标保持在右侧 */
.login-tabs .password-input .ant-input-suffix {
  margin-left: 8px !important;
}

/* 聚焦时无发光 */
.login-tabs .password-input.ant-input-affix-wrapper-focused {
  border-color: #6c5ce7 !important;
  box-shadow: none !important;
}

/* 眼睛图标颜色 */
.login-tabs .password-input .ant-input-password-icon {
  color: rgba(255, 255, 255, 0.6) !important;
}
.login-tabs .password-input .ant-input-password-icon:hover {
  color: #fff !important;
}
`}</style>
    </div>
  );
}