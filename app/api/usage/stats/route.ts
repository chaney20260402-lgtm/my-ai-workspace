import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const ADMIN_PHONE = '你的手机号'; // 🔥 替换成你的手机号

export async function GET() {
  const session = await getServerSession(authOptions);
  
  // ✅ 只有管理员能访问
  if (session?.user?.phone !== ADMIN_PHONE) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // ✅ 所有用户的统计
  const [
    todayTotal,
    allTimeTotal,
    modelUsage,
    userStats,
    allLogs,
  ] = await Promise.all([
    // 今日所有用户消耗
    prisma.usageLog.aggregate({
      where: { createdAt: { gte: today, lt: tomorrow }, success: true },
      _sum: { creditsUsed: true },
      _count: true,
    }),
    // 累计所有用户消耗
    prisma.usageLog.aggregate({
      where: { success: true },
      _sum: { creditsUsed: true },
      _count: true,
    }),
    // 各模型使用统计
    prisma.usageLog.groupBy({
      by: ['model'],
      where: { success: true },
      _count: { model: true },
      _sum: { creditsUsed: true },
    }),
    // 按用户分组统计
    prisma.usageLog.groupBy({
      by: ['userPhone'],
      where: { success: true },
      _count: { userPhone: true },
      _sum: { creditsUsed: true },
      orderBy: { _sum: { creditsUsed: 'desc' } },
    }),
    // 最近20条使用记录（可选）
    prisma.usageLog.findMany({
      where: { success: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        userPhone: true,
        model: true,
        mode: true,
        creditsUsed: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    today: {
      credits: todayTotal._sum?.creditsUsed || 0,
      count: todayTotal._count || 0,
    },
    total: {
      credits: allTimeTotal._sum?.creditsUsed || 0,
      count: allTimeTotal._count || 0,
    },
    byModel: modelUsage,
    byUser: userStats.map((u: any) => ({
      phone: u.userPhone,
      count: u._count?.userPhone || 0,
      credits: u._sum?.creditsUsed || 0,
    })),
    recent: allLogs,
  });
}