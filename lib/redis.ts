// lib/redis.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * 获取 Redis 客户端（支持 Upstash 和本地）
 */
export function getRedis(): Redis {
  if (!redis) {
    // 优先使用 REDIS_URL
    let url = process.env.REDIS_URL;

    // 如果 REDIS_URL 未设置，尝试从 Upstash 变量组合
    if (!url) {
      const restUrl = process.env.UPSTASH_REDIS_REST_URL;
      const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (restUrl && restToken) {
        const host = restUrl.replace(/^https?:\/\//, '');
        url = `redis://default:${restToken}@${host}:6379`;
        console.log('🔧 从 Upstash 变量组合 REDIS_URL');
      }
    }

    if (!url) {
      console.warn('⚠️ 未配置 Redis，使用内存存储（仅开发测试）');
      return createMemoryRedis() as any;
    }

    try {
      // ✅ 修正：移除不支持的 retryDelayOnFailover，使用 retryStrategy
      redis = new Redis(url, {
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        retryStrategy: (times) => {
          // 重试间隔逐渐增加，最多 2 秒
          return Math.min(times * 50, 2000);
        },
      });

      // 测试连接
      redis.ping().then(() => {
        console.log('✅ Redis 连接已建立');
      }).catch((err) => {
        console.error('❌ Redis 连接失败:', err);
      });

    } catch (error) {
      console.error('❌ Redis 初始化失败:', error);
      console.warn('⚠️ 降级到内存存储');
      return createMemoryRedis() as any;
    }
  }
  return redis;
}

/**
 * 内存存储（备用）
 */
function createMemoryRedis() {
  const store = new Map<string, { value: string; expire?: number }>();
  return {
    get: async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expire && Date.now() > entry.expire) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    set: async (key: string, value: string) => {
      store.set(key, { value });
    },
    setex: async (key: string, seconds: number, value: string) => {
      store.set(key, { value, expire: Date.now() + seconds * 1000 });
    },
    del: async (key: string) => {
      store.delete(key);
    },
  };
}