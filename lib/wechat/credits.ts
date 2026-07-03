// lib/credits.ts
import { getRedis } from './redis';

/**
 * 扣除积分并记录变动
 * @param userId 用户ID（手机号）
 * @param cost 扣除的积分数
 * @param reason 扣除原因（如“生成图片”、“导出图层”）
 * @returns 扣除后的剩余积分
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

  // 写入积分变动记录（消耗）
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
 * 增加积分并记录变动（用于充值）
 * @param userId 用户ID（手机号）
 * @param amount 增加的积分数
 * @param reason 充值原因（如“会员充值”、“活动赠送”）
 * @returns 充值后的剩余积分
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
 * 修复：增加容错，过滤掉无效的 JSON 记录，避免 API 崩溃
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
          return null; // 标记为无效记录
        }
      })
      .filter((item) => item !== null); // 过滤掉无效记录
  } catch (error) {
    console.error('读取积分记录失败:', error);
    return []; // 发生任何错误都返回空数组，避免前端报错
  }
}