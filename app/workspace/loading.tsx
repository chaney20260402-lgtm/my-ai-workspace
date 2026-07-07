// app/workspace/loading.tsx
'use client';

import { useState, useEffect } from 'react';

export default function WorkspaceLoading() {
     console.log('✅ loading.tsx 被渲染了！');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    console.log('✅ loading.tsx mounted');
    // 模拟加载进度
    let current = 0;
    const interval = setInterval(() => {
      // 递增进度，到 95% 后减慢，剩余 5% 留给页面实际加载完成
      if (current < 90) {
        current += Math.random() * 10 + 2;
        if (current > 90) current = 90;
      } else if (current < 95) {
        current += 0.5;
      }
      setProgress(Math.min(current, 95));
    }, 200);

    // 当页面实际加载完成时，进度到 100%
    const handleLoad = () => {
      setProgress(100);
      clearInterval(interval);
    };

    // 监听页面加载完成
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fa',
        zIndex: 9999,
        transition: 'opacity 0.6s ease-out',
        opacity: progress === 100 ? 0 : 1,
        pointerEvents: progress === 100 ? 'none' : 'auto',
      }}
    >
      {/* Logo/标题 */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 600, color: '#1677ff', marginBottom: 8 }}>
          🎨 Aguala
        </div>
        <div style={{ fontSize: 14, color: '#999' }}>AI 智能绘图工作台</div>
      </div>

      {/* 进度条 */}
      <div
        style={{
          width: 320,
          maxWidth: '80%',
          height: 8,
          background: '#e8e8e8',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #1677ff, #69c0ff)',
            borderRadius: 4,
            transition: 'width 0.3s ease-out',
            boxShadow: '0 0 12px rgba(22, 119, 255, 0.3)',
          }}
        />
      </div>

      {/* 进度百分比 */}
      <div style={{ marginTop: 16, fontSize: 13, color: '#999', fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(progress)}%
      </div>

      {/* 底部提示 */}
      <div style={{ marginTop: 24, fontSize: 12, color: '#ccc' }}>
        🚀 正在加载您的工作空间...
      </div>
    </div>
  );
}