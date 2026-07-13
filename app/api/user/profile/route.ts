import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// ========== 辅助函数：生成6位邀请码 ==========
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ========== 辅助函数：生成唯一邀请码 ==========
const generateUniqueInviteCode = async (): Promise<string> => {
  let code = generateInviteCode();
  // 确保邀请码唯一
  while (await prisma.user.findUnique({ where: { myInviteCode: code } })) {
    code = generateInviteCode();
  }
  return code;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userPhone = session.user.phone;

    // 获取用户信息
    let user = await prisma.user.findUnique({
      where: { phone: userPhone },
      select: {
        phone: true,
        credits: true,
        membershipType: true,
        myInviteCode: true,
        inviteRewards: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // ============================================================
    // ✅ 新增：如果用户没有邀请码，自动生成
    // ============================================================
    if (!user.myInviteCode) {
      const newCode = await generateUniqueInviteCode();
      await prisma.user.update({
        where: { phone: userPhone },
        data: { myInviteCode: newCode },
      });
      // ✅ 更新返回对象中的邀请码
      user.myInviteCode = newCode;
      console.log(`✅ 为用户 ${userPhone} 生成邀请码: ${newCode}`);
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}