'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Input, Form, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const LoginPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  // ---------- 鼠标追踪波纹效果 (Canvas) ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // 防止 canvas 不存在

    const ctx = canvas.getContext('2d');
    // ✅ 关键修复：如果获取上下文失败，直接退出
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // 波纹数组
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

    // 动画循环
    const animate = () => {
      // ✅ 此时 ctx 已确保非空，无需再检查
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

  // ---------- 环绕旋转图标 ----------
  const icons = [
    { name: 'GPT', color: '#74aa9c' },
    { name: 'MJ', color: '#a97bcc' },
    { name: 'SD', color: '#f472b6' },
    { name: 'DALL-E', color: '#60a5fa' },
    { name: 'Krea', color: '#facc15' },
    { name: 'Lexica', color: '#fb923c' },
  ];

  // ---------- 登录逻辑 ----------
  const handleLogin = (values: any) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('登录成功，即将跳转...');
      // 可跳转至工作台
      // router.push('/workspace');
    }, 1500);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 50%, #1a1a2e, #16213e, #0f3460)',
    }}>
      {/* Canvas 背景层（鼠标穿透） */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* 环绕旋转图标组 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '320px',
        height: '320px',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          animation: 'spin 25s linear infinite',
        }}>
          {icons.map((icon, index) => {
            const angle = (index / icons.length) * 360;
            return (
              <div key={icon.name} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `rotate(${angle}deg) translateY(-150px)`,
                color: icon.color,
                fontSize: '20px',
                fontWeight: 'bold',
                textShadow: `0 0 30px ${icon.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.08)',
                letterSpacing: '0.5px',
              }}>
                {icon.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* 登录卡片 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '420px',
        padding: '48px 40px',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        borderRadius: '28px',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
        zIndex: 10,
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#fff',
          fontSize: '30px',
          fontWeight: 600,
          marginBottom: 4,
          letterSpacing: '1px',
        }}>
          AI 创作空间
        </h1>
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 28,
          fontSize: '14px',
        }}>
          登录以访问您的AI工作流
        </p>

        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
              placeholder="用户名"
              size="large"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                height: 48,
                borderRadius: 12,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            style={{ marginBottom: 24 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
              placeholder="密码"
              size="large"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                height: 48,
                borderRadius: 12,
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: 48,
                background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                border: 'none',
                borderRadius: 12,
                fontWeight: 500,
                fontSize: 16,
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* 全局 CSS 动画和输入框样式覆盖 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .ant-input, .ant-input-password {
          background: rgba(255,255,255,0.05) !important;
          color: #fff !important;
        }
        .ant-input::placeholder, .ant-input-password input::placeholder {
          color: rgba(255,255,255,0.3) !important;
        }
        .ant-input-password .ant-input {
          background: transparent !important;
        }
        /* 修复输入框内文字颜色 */
        .ant-input-password input {
          color: #fff !important;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;