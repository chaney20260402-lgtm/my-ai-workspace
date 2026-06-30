'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface CreditsContextType {
  credits: number | null;
  setCredits: (credits: number) => void;
  refreshCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);

  // 从服务端获取最新积分（用于页面初始化或手动刷新）
  const refreshCredits = async () => {
    try {
      const res = await fetch('/api/user/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
      } else {
        console.error('获取积分失败:', res.status);
      }
    } catch (error) {
      console.error('获取积分异常:', error);
    }
  };

  // 首次加载时自动获取积分
  useEffect(() => {
    refreshCredits();
  }, []);

  return (
    <CreditsContext.Provider value={{ credits, setCredits, refreshCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}