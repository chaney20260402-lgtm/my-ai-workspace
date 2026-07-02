// app/contexts/CreditsContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface CreditsContextType {
  credits: number;
  setCredits: (v: number) => void;
  refreshCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType>({
  credits: 0,
  setCredits: () => {},
  refreshCredits: async () => {},
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState(0);

  const refreshCredits = async () => {
    try {
      const res = await fetch('/api/user/credits');
      const data = await res.json();
      if (data.credits !== undefined) {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('刷新积分失败:', error);
    }
  };

  useEffect(() => {
    refreshCredits();
  }, []);

  return (
    <CreditsContext.Provider value={{ credits, setCredits, refreshCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export const useCredits = () => useContext(CreditsContext);