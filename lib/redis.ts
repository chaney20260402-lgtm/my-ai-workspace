// lib/redis.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * 获取 Redis 客户端实例（单例模式）
 */
export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('❌ REDIS_URL 环境变量未配置，请设置 Redis 连接地址');
    }
    redis = new Redis(url);
    console.log('✅ Redis 连接已建立');
  }
  return redis;
}

/**
 * 关闭 Redis 连接（可选，用于应用关闭时清理）
 */
export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('✅ Redis 连接已关闭');
  }
}