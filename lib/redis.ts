// lib/redis.ts

// 内存存储（仅用于开发测试，重启后数据丢失）
const memoryStore = new Map<string, { value: string; expireAt?: number }>();

export function getRedis() {
  return {
    async get(key: string): Promise<string | null> {
      const entry = memoryStore.get(key);
      if (!entry) return null;
      // 检查是否过期
      if (entry.expireAt && Date.now() > entry.expireAt) {
        memoryStore.delete(key);
        return null;
      }
      return entry.value;
    },

    async set(key: string, value: string): Promise<void> {
      memoryStore.set(key, { value });
    },

    async setex(key: string, seconds: number, value: string): Promise<void> {
      memoryStore.set(key, {
        value,
        expireAt: Date.now() + seconds * 1000,
      });
    },

    async del(key: string): Promise<void> {
      memoryStore.delete(key);
    },

    async lpush(key: string, value: string): Promise<void> {
      // 简单实现：用数组存储
      const listKey = `_list_${key}`;
      const existing = memoryStore.get(listKey);
      if (existing) {
        const list = JSON.parse(existing.value);
        list.unshift(value);
        memoryStore.set(listKey, { value: JSON.stringify(list) });
      } else {
        memoryStore.set(listKey, { value: JSON.stringify([value]) });
      }
    },

    async lrange(key: string, start: number, stop: number): Promise<string[]> {
      const listKey = `_list_${key}`;
      const entry = memoryStore.get(listKey);
      if (!entry) return [];
      const list = JSON.parse(entry.value);
      return list.slice(start, stop + 1);
    },

    async ltrim(key: string, start: number, stop: number): Promise<void> {
      const listKey = `_list_${key}`;
      const entry = memoryStore.get(listKey);
      if (!entry) return;
      const list = JSON.parse(entry.value);
      const trimmed = list.slice(start, stop + 1);
      memoryStore.set(listKey, { value: JSON.stringify(trimmed) });
    },
  };
}