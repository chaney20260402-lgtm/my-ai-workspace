import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userPhone = session.user.phone;

    // 检查用户是否已有会员类型（默认体验）
    const user = await prisma.user.findUnique({
      where: { phone: userPhone },
    });
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 查询今天的领取记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayClaim = await prisma.dailyExperienceClaim.findFirst({
      where: {
        userPhone,
        claimDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (todayClaim) {
      return NextResponse.json({ error: '今天已领取过' }, { status: 400 });
    }

    // 查询总领取天数（用于计算第几天）
    const totalClaims = await prisma.dailyExperienceClaim.count({
      where: { userPhone },
    });

    // 如果已经领取了5天，不能再领
    if (totalClaims >= 5) {
      return NextResponse.json({ error: '已领取完5次体验包' }, { status: 400 });
    }

    const day = totalClaims + 1; // 第1-5天

    // 执行积分增加和记录
    const result = await prisma.$transaction(async (tx) => {
      // 1. 增加用户积分
      const updatedUser = await tx.user.update({
        where: { phone: userPhone },
        data: { credits: { increment: 20 } },
      });

      // 2. 记录积分变动
      await tx.creditTransaction.create({
        data: {
          userPhone,
          amount: 20,
          type: 'claim_experience',
          description: `体验包第${day}天领取`,
        },
      });

      // 3. 记录每日领取
      await tx.dailyExperienceClaim.create({
        data: {
          userPhone,
          day,
          claimDate: new Date(),
        },
      });

      // 4. 如果该用户是被邀请的，触发邀请奖励
      if (user.invitedBy) {
        // 检查是否已经给邀请人发过奖励（避免重复）
        const existingReward = await tx.creditTransaction.findFirst({
          where: {
            userPhone: user.invitedBy,
            type: 'invite_reward',
            description: `邀请 ${userPhone} 领取体验包`,
          },
        });
        if (!existingReward) {
          // 给邀请人增加30积分
          await tx.user.update({
            where: { phone: user.invitedBy },
            data: { credits: { increment: 30 }, inviteRewards: { increment: 30 } },
          });
          await tx.creditTransaction.create({
            data: {
              userPhone: user.invitedBy,
              amount: 30,
              type: 'invite_reward',
              description: `邀请 ${userPhone} 领取体验包`,
            },
          });
        }
      }

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      credits: result.credits,
      day,
      message: `第${day}天领取成功 +20 积分`,
    });
  } catch (error) {
    console.error('领取体验包失败:', error);
    return NextResponse.json({ error: '领取失败，请重试' }, { status: 500 });
  }
}