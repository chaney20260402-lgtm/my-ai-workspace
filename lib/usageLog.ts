import { prisma } from './prisma';

interface CreateUsageLogParams {
  userPhone: string;
  model: string;
  mode: 'generate' | 'psd_export';
  creditsUsed: number;
  prompt?: string;
  success?: boolean;
}

export async function createUsageLog(params: CreateUsageLogParams) {
  try {
    // 通过 userPhone 查找用户
    const user = await prisma.user.findUnique({
      where: { phone: params.userPhone },
      select: { id: true },
    });
    if (!user) {
      console.error('用户不存在，无法记录日志:', params.userPhone);
      return;
    }
    return await prisma.usageLog.create({
      data: {
        userId: user.id,
        userPhone: params.userPhone,
        model: params.model,
        mode: params.mode,
        creditsUsed: params.creditsUsed,
        prompt: params.prompt,
        success: params.success ?? true,
      },
    });
  } catch (error) {
    console.error('记录使用日志失败:', error);
  }
}