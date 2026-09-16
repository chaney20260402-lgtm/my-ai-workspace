'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, Badge } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined } from '@ant-design/icons';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '你好！有什么可以帮你的吗？' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const guestIdRef = useRef<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!guestIdRef.current) {
      guestIdRef.current = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: text,
          guestId: guestIdRef.current,
        }),
      });

      if (!res.ok) throw new Error('请求失败');

      const data = await res.json();
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: data.needsHuman ? 'system' : 'assistant', content: data.reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '网络错误，请稍后重试。' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <Badge dot={!open} offset={[-4, 4]}>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={open ? <CloseOutlined /> : <MessageOutlined />}
          onClick={() => setOpen(!open)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            width: 56,
            height: 56,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        />
      </Badge>

      {/* 聊天窗口 */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            zIndex: 9999,
            width: 340,
            height: 480,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* 头部 */}
          <div
            style={{
              padding: '12px 16px',
              background: '#1677ff',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 500 }}>智能客服</span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>AI 驱动</span>
          </div>

          {/* 消息区 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              background: '#f5f5f5',
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    background:
                      m.role === 'user'
                        ? '#1677ff'
                        : m.role === 'system'
                        ? '#fff7e6'
                        : '#fff',
                    color:
                      m.role === 'user'
                        ? '#fff'
                        : m.role === 'system'
                        ? '#ad6800'
                        : '#333',
                    border: m.role === 'assistant' ? '1px solid #e8e8e8' : 'none',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                  }}
                >
                  <Spin size="small" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 输入区 */}
          <div
            style={{
              padding: 12,
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              gap: 8,
              background: '#fff',
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={sendMessage}
              placeholder="输入问题..."
              disabled={loading}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            />
          </div>
        </div>
      )}
    </>
  );
}