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