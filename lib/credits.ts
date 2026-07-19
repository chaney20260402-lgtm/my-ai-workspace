// lib/credits.ts
import { prisma } from '@/lib/prisma';

/**
 * 获取用户当前积分（直接从数据库）
 */
export async function getUserCredits(phone: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { phone },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}

/**
 * 扣除积分（事务），返回新积分
 * 如果积分不足，抛出错误
 */
export async function deductCredits(
  phone: string,
  amount: number,
  description: string,
  type: string = 'consume'
): Promise<number> {
  if (amount <= 0) throw new Error('扣除积分必须为正数');

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { phone },
      select: { credits: true },
    });
    if (!user) throw new Error('用户不存在');
    if (user.credits < amount) {
      throw new Error(`积分不足，需要 ${amount}，当前 ${user.credits}`);
    }

    const updated = await tx.user.update({
      where: { phone },
      data: { credits: { decrement: amount } },
      select: { credits: true },
    });

    await tx.creditTransaction.create({
      data: {
        userPhone: phone,
        amount: -amount,
        type: type,
        description: description,
      },
    });

    return updated.credits;
  });

  return result;
}

/**
 * 增加积分（事务），返回新积分
 */
export async function addCredits(
  phone: string,
  amount: number,
  description: string,
  type: string = 'recharge'
): Promise<number> {
  if (amount <= 0) throw new Error('增加积分必须为正数');

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { phone },
      data: { credits: { increment: amount } },
      select: { credits: true },
    });

    await tx.creditTransaction.create({
      data: {
        userPhone: phone,
        amount: amount,
        type: type,
        description: description,
      },
    });

    return updated.credits;
  });

  return result;
}

/**
 * 获取用户的积分变动记录（从数据库）
 */
export async function getCreditRecords(phone: string, limit: number = 30) {
  const records = await prisma.creditTransaction.findMany({
    where: { userPhone: phone },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      amount: true,
      type: true,
      description: true,
      createdAt: true,
    },
  });
  return records.map(r => ({
    ...r,
    balance: 0,
  }));
}

// ============================================================
// ✅ 保留纯计算函数（不涉及存储）
// ============================================================
export { 
  VIDEO_RATES, 
  getVideoRates, 
  calculateVideoCredits 
} from './video-credits';

// ============================================================
// ⚠️ 以下旧函数已废弃，仅保留作为兼容过渡，请尽快替换
// ============================================================
export async function checkUserCredits(userId: string, requiredCredits: number): Promise<boolean> {
  console.warn('⚠️ checkUserCredits 已废弃，请使用 getUserCredits');
  const credits = await getUserCredits(userId);
  return credits >= requiredCredits;
}

export async function checkAndDeductCredits(
  userId: string,
  cost: number,
  reason?: string
): Promise<number> {
  console.warn('⚠️ checkAndDeductCredits 已废弃，请使用 deductCredits');
  return deductCredits(userId, cost, reason || '消耗积分', 'consume');
}

export async function getCredits(userId: string): Promise<number> {
  console.warn('⚠️ getCredits 已废弃，请使用 getUserCredits');
  return getUserCredits(userId);
}