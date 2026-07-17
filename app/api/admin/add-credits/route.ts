import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // 导入 authOptions

// 管理员手机号（从环境变量读取，硬编码兜底）
const ADMIN_PHONE = process.env.ADMIN_PHONE || '13929767725';

export async function POST(req: NextRequest) {
  try {
    // 1. 显式传入 authOptions，确保 session 包含 phone 字段
    const session = await getServerSession(authOptions);
    const currentPhone = session?.user?.phone;

    // 调试日志（部署后可在 Vercel Functions 中查看）
    console.log('🔍 [add-credits] session:', JSON.stringify(session, null, 2));
    console.log('🔍 [add-credits] currentPhone:', currentPhone);
    console.log('🔍 [add-credits] ADMIN_PHONE:', ADMIN_PHONE);

    // 2. 验证是否为管理员
    if (!currentPhone) {
      console.error('❌ session.user.phone 不存在');
      return NextResponse.json({ error: '未登录或 session 无效' }, { status: 401 });
    }
    if (currentPhone !== ADMIN_PHONE) {
      console.error(`❌ 权限拒绝: ${currentPhone} !== ${ADMIN_PHONE}`);
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
    console.error('❌ 积分补偿失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}