// lib/credits.ts
import { getRedis } from './redis';
import { prisma } from '@/lib/prisma';

/**
 * 检查用户积分是否充足（基于 Redis）
 */
export async function checkUserCredits(userId: string, requiredCredits: number): Promise<boolean> {
  const redis = getRedis();
  const userKey = `user:${userId}`;
  const credits = parseInt((await redis.get(userKey)) || '0');
  return credits >= requiredCredits;
}

/**
 * 检查用户积分是否充足（基于数据库）
 */
export async function checkUserCreditsFromDB(userPhone: string, requiredCredits: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { phone: userPhone },
    select: { credits: true },
  });
  
  if (!user) return false;
  return user.credits >= requiredCredits;
}

/**
 * 扣除积分并记录变动
 */
export async function checkAndDeductCredits(
  userId: string,
  cost: number,
  reason?: string
): Promise<number> {
  const redis = getRedis();
  const userKey = `user:${userId}`;
  const currentCredits = parseInt((await redis.get(userKey)) || '0');

  if (currentCredits < cost) {
    throw new Error(`积分不足，当前积分 ${currentCredits}，需要 ${cost} 积分`);
  }

  const newCredits = currentCredits - cost;
  await redis.set(userKey, String(newCredits));

  const recordKey = `credit_records:${userId}`;
  const record = JSON.stringify({
    amount: -cost,
    type: 'consume',
    description: reason || `消耗 ${cost} 积分`,
    createdAt: new Date().toISOString(),
  });
  await redis.lpush(recordKey, record);
  await redis.ltrim(recordKey, 0, 99);

  return newCredits;
}

/**
 * 增加积分并记录变动
 */
export async function addCredits(
  userId: string,
  amount: number,
  reason?: string
): Promise<number> {
  const redis = getRedis();
  const userKey = `user:${userId}`;
  const currentCredits = parseInt((await redis.get(userKey)) || '0');
  const newCredits = currentCredits + amount;
  await redis.set(userKey, String(newCredits));

  const recordKey = `credit_records:${userId}`;
  const record = JSON.stringify({
    amount: amount,
    type: 'recharge',
    description: reason || `充值 ${amount} 积分`,
    createdAt: new Date().toISOString(),
  });
  await redis.lpush(recordKey, record);
  await redis.ltrim(recordKey, 0, 99);

  return newCredits;
}

/**
 * 获取用户当前积分
 */
export async function getCredits(userId: string): Promise<number> {
  const redis = getRedis();
  const userKey = `user:${userId}`;
  const credits = parseInt((await redis.get(userKey)) || '0');
  return credits;
}

/**
 * 获取用户的积分变动记录（最近 N 条）
 */
export async function getCreditRecords(userId: string, limit: number = 30): Promise<any[]> {
  const redis = getRedis();
  const recordKey = `credit_records:${userId}`;
  try {
    const records = await redis.lrange(recordKey, 0, limit - 1);
    return records
      .map((r) => {
        try {
          return JSON.parse(r);
        } catch (e) {
          console.error('解析积分记录失败，原始数据:', r, e);
          return null;
        }
      })
      .filter((item) => item !== null);
  } catch (error) {
    console.error('读取积分记录失败:', error);
    return [];
  }
}

// ============================================================
// ✅ 视频生成积分费率配置
// ============================================================

/**
 * 视频生成积分费率配置
 * 注意：模型名称与 xAI API 保持一致，使用 -preview 后缀
 */
export const VIDEO_RATES = {
  'grok-imagine-video': {
    imagePerImage: 0.2,
    videoPerSecond: { '480p': 1, '720p': 5, '1080p': 7 },
  },
  // 1.5 版本只有 preview 后缀的模型
  'grok-imagine-video-1.5-preview': {
    imagePerImage: 1,
    videoPerSecond: { '480p': 8, '720p': 14, '1080p': 17.5 },
  },
  // 后续可扩展其他模型
  // 'wan2.7': { ... },
  // 'veo-3.1-official': { ... },
};

/**
 * 获取模型费率
 * @param model 模型名称（会自动移除 -preview 后缀匹配）
 * @returns 费率配置对象，如果找不到则返回 null
 */
export function getVideoRates(model: string) {
  // 先直接匹配
  if (VIDEO_RATES[model as keyof typeof VIDEO_RATES]) {
    return VIDEO_RATES[model as keyof typeof VIDEO_RATES];
  }
  // 如果找不到，尝试移除 -preview 后缀匹配
  const baseModel = model.replace(/-preview$/, '');
  return VIDEO_RATES[baseModel as keyof typeof VIDEO_RATES] || null;
}

/**
 * 计算视频生成所需积分
 * @param model 模型名称（如 'grok-imagine-video-1.5-preview'）
 * @param resolution 分辨率 '480p' | '720p' | '1080p'
 * @param duration 时长（秒）
 * @param imageCount 图片数量（0 或 1）
 * @returns 所需积分（向上取整），如果模型不支持则返回 0
 */
export function calculateVideoCredits(
  model: string,
  resolution: string,
  duration: number,
  imageCount: number = 0
): number {
  const rates = getVideoRates(model);
  if (!rates) return 0; // 未知模型返回 0，调用方需处理

  const imageCost = rates.imagePerImage * imageCount;
  const ratePerSecond = rates.videoPerSecond[resolution as keyof typeof rates.videoPerSecond];
  if (!ratePerSecond) return 0; // 不支持的分辨率

  const videoCost = ratePerSecond * duration;
  return Math.ceil(imageCost + videoCost);
}