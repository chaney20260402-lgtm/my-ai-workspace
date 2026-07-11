import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.phone) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const transactions = await prisma.creditTransaction.findMany({
    where: { userPhone: session.user.phone },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ success: true, data: transactions });
}