import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - 获取单个工作流
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const workflow = await prisma.workflow.findFirst({
      where: { id: parseInt(id), userPhone: session.user.phone },
    });

    if (!workflow) {
      return NextResponse.json({ error: '工作流不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error('获取工作流失败:', error);
    return NextResponse.json({ error: '获取工作流失败' }, { status: 500 });
  }
}

// PUT - 更新工作流
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, model, size, aspectRatio, platform, language, prompts, referenceImages, generatedImages } = body;

    const workflow = await prisma.workflow.findFirst({
      where: { id: parseInt(id), userPhone: session.user.phone },
    });

    if (!workflow) {
      return NextResponse.json({ error: '工作流不存在' }, { status: 404 });
    }

    const updated = await prisma.workflow.update({
      where: { id: parseInt(id) },
      data: {
        name: name || workflow.name,
        model: model || workflow.model,
        size: size || workflow.size,
        aspectRatio: aspectRatio || workflow.aspectRatio,
        platform: platform || workflow.platform,
        language: language || workflow.language,
        prompts: prompts ?? workflow.prompts,
        referenceImages: referenceImages ?? workflow.referenceImages,
        generatedImages: generatedImages ?? workflow.generatedImages,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('更新工作流失败:', error);
    return NextResponse.json({ error: '更新工作流失败' }, { status: 500 });
  }
}

// DELETE - 删除工作流
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phone) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.workflow.delete({
      where: { id: parseInt(id), userPhone: session.user.phone },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除工作流失败:', error);
    return NextResponse.json({ error: '删除工作流失败' }, { status: 500 });
  }
}