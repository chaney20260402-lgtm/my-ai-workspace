// lib/store.ts
export interface CodeRecord {
  code: string;
  expires: number;
}

// 验证码存储（生产环境建议用 Redis）
export const codeStore: Record<string, CodeRecord> = {};