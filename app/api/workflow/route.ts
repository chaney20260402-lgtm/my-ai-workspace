import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - 获取当前用户的所有工作流
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { userPhone: session.user.phone },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: workflows });
  } catch (error) {
    console.error('获取工作流列表失败:', error);
    return NextResponse.json({ error: '获取工作流列表失败' }, { status: 500 });
  }
}

// POST - 创建新工作流
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { name, model, size, aspectRatio, platform, language, prompts, referenceImages, generatedImages } = body;

    if (!name) {
      return NextResponse.json({ error: '工作流名称不能为空' }, { status: 400 });
    }

    // ============================================================
    // ✅ 新增：工作流数量限制检查
    // ============================================================
    const existingCount = await prisma.workflow.count({
      where: { userPhone: session.user.phone },
    });

    const membershipType = session.user.membershipType || 'experience';
    const limits = {
      experience: 1,
      advanced: 3,
      professional: Infinity,
    };
    const limit = limits[membershipType as keyof typeof limits] || 1;

    if (existingCount >= limit) {
      return NextResponse.json({
        error: `您的会员类型最多只能保存 ${limit === Infinity ? '无限制' : limit} 个工作流，请升级会员`,
      }, { status: 403 });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        model: model || 'nanobanana-pro',
        size: size || '2K',
        aspectRatio: aspectRatio || '1:1',
        platform: platform || 'taobao',
        language: language || 'zh',
        prompts: prompts || [''],
        referenceImages: referenceImages || [],
        generatedImages: generatedImages || [],
        userPhone: session.user.phone,
      },
    });

    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error('创建工作流失败:', error);
    return NextResponse.json({ error: '创建工作流失败' }, { status: 500 });
  }
}