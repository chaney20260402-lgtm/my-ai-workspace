// lib/avatar.ts

// 预设头像列表（使用随机头像生成服务，可通过不同seed得到不同头像）
const AVATAR_BASE = 'https://api.dicebear.com/7.x/adventurer/svg?seed=';

// 预设种子列表
export const avatarSeeds = [
  'a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8',
  'i9', 'j0', 'k1', 'l2', 'm3', 'n4', 'o5', 'p6',
  'q7', 'r8', 's9', 't0', 'u1', 'v2', 'w3', 'x4',
];

/**
 * 获取当前用户头像 URL
 */
export function getUserAvatar(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userAvatar') || null;
}

/**
 * 设置用户头像
 */
export function setUserAvatar(seed: string): void {
  if (typeof window === 'undefined') return;
  const url = `${AVATAR_BASE}${seed}`;
  localStorage.setItem('userAvatar', url);
}

/**
 * 获取头像 URL（如果未设置则返回默认头像 URL）
 */
export function getAvatarUrl(): string {
  const saved = getUserAvatar();
  if (saved) return saved;
  // 默认头像（也可以使用随机生成）
  return `${AVATAR_BASE}default`;
}

/**
 * 获取所有预设头像 URL 列表（用于展示）
 */
export function getPresetAvatars(): string[] {
  return avatarSeeds.map((seed) => `${AVATAR_BASE}${seed}`);
}

/**
 * 根据 seed 获取单个头像 URL
 */
export function getAvatarBySeed(seed: string): string {
  return `${AVATAR_BASE}${seed}`;
}