import { prisma } from '@/lib/prisma';

interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  language: string;
  enabled: boolean;
  createdAt: Date;
}

export async function searchKnowledgeBase(query: string, limit = 3): Promise<KnowledgeItem[]> {
  if (!query || query.trim().length === 0) return [];

  const words = query
    .replace(/[，。？！、,.?!]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 5);

  if (words.length === 0) return [];

  try {
    const results = await prisma.knowledgeBase.findMany({
      where: {
        enabled: true,
        OR: words.flatMap((word) => [
          { question: { contains: word } },
          { answer: { contains: word } },
        ]),
      },
      take: limit,
    });
    return results;
  } catch (error) {
    console.error('知识库检索失败:', error);
    return [];
  }
}