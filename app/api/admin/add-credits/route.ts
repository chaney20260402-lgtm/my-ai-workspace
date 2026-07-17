import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// 你的管理员手机号（与页面权限保持一致）
const ADMIN_PHONE = process.env.ADMIN_PHONE || '13929767725'; // 替换为你的真实号码

export async function POST(req: NextRequest) {
  try {
    // 1. 获取当前登录用户
    const session = await getServerSession();
    const currentPhone = session?.user?.phone;

    // 2. 验证是否为管理员（与页面权限一致）
    if (!currentPhone || currentPhone !== ADMIN_PHONE) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 3. 获取请求参数
    const { phone, credits, reason } = await req.json();
    if (!phone || !credits || credits <= 0) {
      return NextResponse.json({ error: '手机号和积分数量必填，且积分必须为正数' }, { status: 400 });
    }

    // 4. 查找目标用户
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 5. 事务：增加积分 + 记录交易
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { phone },
        data: { credits: { increment: credits } },
      });

      await tx.creditTransaction.create({
        data: {
          userPhone: phone,
          amount: credits,
          type: 'admin_adjust',
          description: reason || '管理员手动发放',
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      newCredits: updatedUser.credits,
    });
  } catch (error) {
    console.error('积分补偿失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}