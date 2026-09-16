import { getRedis } from './redis';

const CONTEXT_TTL = 60 * 60 * 24; // 24小时
const MAX_CONTEXT_MESSAGES = 20;

export interface ChatContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getChatContext(conversationId: string): Promise<ChatContextMessage[]> {
  const redis = getRedis();
  const key = `chat:context:${conversationId}`;
  try {
    const raw = await redis.lrange(key, 0, MAX_CONTEXT_MESSAGES - 1);
    return raw.map((r) => JSON.parse(r)).reverse();
  } catch (error) {
    console.error('读取对话上下文失败:', error);
    return [];
  }
}

export async function appendChatContext(
  conversationId: string,
  message: ChatContextMessage
): Promise<void> {
  const redis = getRedis();
  const key = `chat:context:${conversationId}`;
  try {
    await redis.lpush(key, JSON.stringify(message));
    await redis.ltrim(key, 0, MAX_CONTEXT_MESSAGES - 1);
    await redis.expire(key, CONTEXT_TTL);
  } catch (error) {
    console.error('写入对话上下文失败:', error);
  }
}

export async function clearChatContext(conversationId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`chat:context:${conversationId}`);
}