'use client';

import { Modal, Progress, Typography } from 'antd';
import { useState, useEffect } from 'react';

const { Text } = Typography;

// 可爱的提示语列表
const cuteMessages = [
  '🎨 正在施展魔法，请稍候...',
  '✨ 小精灵正在为你作画~',
  '🌈 调色中，马上就好！',
  '🪄 挥一挥魔杖，图片即将出现！',
  '🌟 星星在排队，请耐心等待~',
  '🍀 好运加持，生成中...',
  '💫 正在准备你的杰作！',
  '🌸 美好事物值得等待~',
  '🎈 马上就好，再坚持一下！',
  '🧸 小助手正在努力工作中！',
];

interface LoadingProgressModalProps {
  visible: boolean;
  title?: string;
  onComplete?: () => void;
}

export default function LoadingProgressModal({
  visible,
  title = '正在处理...',
  onComplete,
}: LoadingProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(cuteMessages[0]);

  // 重置状态（每次打开重新开始）
  useEffect(() => {
    if (visible) {
      setProgress(0);
      setMessage(cuteMessages[Math.floor(Math.random() * cuteMessages.length)]);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          // 随机增加 1-5，模拟进度
          const increment = Math.floor(Math.random() * 5) + 1;
          return Math.min(prev + increment, 100);
        });
      }, 300);
      // 更改提示语（每3秒）
      const msgInterval = setInterval(() => {
        setMessage(cuteMessages[Math.floor(Math.random() * cuteMessages.length)]);
      }, 3000);
      return () => {
        clearInterval(interval);
        clearInterval(msgInterval);
      };
    } else {
      // 弹窗关闭时重置进度
      setProgress(0);
    }
  }, [visible]);

  // 当进度到达100时，延迟关闭并触发回调
  useEffect(() => {
    if (progress >= 100 && visible) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, visible, onComplete]);

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      maskClosable={false}
      centered
      width={420}
      bodyStyle={{ padding: '32px 24px' }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
        <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 8 }}>
          {title}
        </Text>
        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24 }}>
          {message}
        </Text>
        <Progress
          percent={progress}
          status={progress < 100 ? 'active' : 'success'}
          strokeColor={{
            from: '#6c5ce7',
            to: '#a29bfe',
          }}
          trailColor="#f0f0f0"
          strokeWidth={12}
          style={{ marginBottom: 8 }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {progress < 100 ? `${Math.floor(progress)}%` : '🎉 完成！'}
        </Text>
      </div>
    </Modal>
  );
}