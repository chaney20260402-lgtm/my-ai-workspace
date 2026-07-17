import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PHONE = process.env.ADMIN_PHONE || '13929767725';

export async function POST(req: NextRequest) {
  try {
    // 从请求体获取所有参数，包括 adminPhone
    const { phone, credits, reason, adminPhone } = await req.json();

    // 验证管理员身份（直接比较 adminPhone 和预设值）
    if (!adminPhone || adminPhone !== ADMIN_PHONE) {
      console.error(`❌ 权限拒绝: adminPhone=${adminPhone}, ADMIN_PHONE=${ADMIN_PHONE}`);
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 参数校验
    if (!phone || !credits || credits <= 0) {
      return NextResponse.json({ error: '手机号和积分数量必填，且积分必须为正数' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

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