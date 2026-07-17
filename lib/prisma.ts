import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // 不要加 connectionTimeout，它不被支持
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;