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
    // 查找用户，如果不存在则创建
    let user = await prisma.user.findUnique({
      where: { phone: params.userPhone },
    });

    if (!user) {
      // ✅ 自动创建用户
      user = await prisma.user.create({
        data: {
          phone: params.userPhone,
          credits: 0, // 初始积分为0，登录后会从 localStorage 或其他逻辑获取
        },
      });
      console.log('✅ 自动创建用户:', user.phone);
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
    console.error('❌ 记录使用日志失败:', error);
  }
}