import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getChatContext, appendChatContext } from '@/lib/chat-context';
import { searchKnowledgeBase } from '@/lib/knowledge';
import { callLLM, LLMMessage } from '@/lib/llm';

const TRANSFER_KEYWORDS = ['转人工', '人工客服', '投诉', 'human', 'agent', '真人'];

const DEFAULT_SYSTEM_PROMPT = `你是一个跨境电商智能客服，请用友好、专业的语气回答用户问题。
规则：
1. 如果知识库有相关内容，优先使用知识库答案。
2. 如果知识库没有，诚实告知用户，并建议转人工。
3. 不要编造信息，不要承诺你做不到的事。
4. 回答简洁，控制在100字以内。`;

export async function POST(req: NextRequest) {
  try {
    const { conversationId, message, guestId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    let conversation = conversationId
      ? await prisma.conversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          guestId: guestId || `guest_${Date.now()}`,
          status: 'active',
          language: 'zh',
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    const userWantsHuman = TRANSFER_KEYWORDS.some((k) =>
      message.toLowerCase().includes(k.toLowerCase())
    );

    if (userWantsHuman) {
      const reply = '正在为您转接人工客服，请稍候...';
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'system',
          content: reply,
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'transferred' },
      });
      await appendChatContext(conversation.id, { role: 'user', content: message });
      await appendChatContext(conversation.id, { role: 'assistant', content: reply });
      return NextResponse.json({
        conversationId: conversation.id,
        reply,
        needsHuman: true,
      });
    }

    const kbResults = await searchKnowledgeBase(message);
    const context = await getChatContext(conversation.id);
    const kbText = kbResults.length
      ? kbResults.map((r) => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n')
      : '（暂无相关知识库内容）';

    const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\n知识库参考：\n${kbText}`;

    const llmMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context,
      { role: 'user', content: message },
    ];

    let aiReply: string;
    try {
      aiReply = await callLLM(llmMessages);
    } catch (error) {
      console.error('LLM 调用失败:', error);
      aiReply = '抱歉，系统繁忙，请稍后再试或转人工客服。';
    }

    const aiUncertain = ['我不确定', '我无法回答', '建议您联系人工', '建议转人工'].some((k) =>
      aiReply.includes(k)
    );
    const needsHuman = aiUncertain;

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: needsHuman ? 'system' : 'assistant',
        content: aiReply,
        metadata: {
          kbHit: kbResults.length > 0,
          kbCount: kbResults.length,
        },
      },
    });

    await appendChatContext(conversation.id, { role: 'user', content: message });
    await appendChatContext(conversation.id, { role: 'assistant', content: aiReply });

    if (needsHuman) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'transferred' },
      });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      reply: aiReply,
      needsHuman,
    });
  } catch (error) {
    console.error('客服接口异常:', error);
    return NextResponse.json({ error: '服务器异常' }, { status: 500 });
  }
}