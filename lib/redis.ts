// lib/redis.ts
import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

export function getRedis() {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Redis credentials missing');
    }
    redisInstance = new Redis({ url, token });
  }
  return redisInstance;
}