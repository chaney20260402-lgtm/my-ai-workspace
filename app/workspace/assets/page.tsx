'use client';

import { useState, useMemo } from 'react';
import { Card, Select, Row, Col, Typography, Tag, Space, Divider } from 'antd';
import {
  OpenAI,
  Claude,
  Gemini,
  DeepSeek,
  Qwen,
} from '@lobehub/icons';
import { StarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// ========== 模型数据 ==========
interface Model {
  id: string;
  name: string;
  provider: string;
  promptPrice: number;
  completionPrice: number;
  billingType: string;
}

const modelData: Model[] = [
  // ===== OpenAI =====
  { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', provider: 'OpenAI', promptPrice: 0.5, completionPrice: 1.5, billingType: '按量计费' },
  { id: 'gpt-3.5-turbo-0125', name: 'gpt-3.5-turbo-0125', provider: 'OpenAI', promptPrice: 0.5, completionPrice: 1.5, billingType: '按量计费' },
  { id: 'gpt-3.5-turbo-0613', name: 'gpt-3.5-turbo-0613', provider: 'OpenAI', promptPrice: 1.5, completionPrice: 1.95, billingType: '按量计费' },
  { id: 'gpt-3.5-turbo-1106', name: 'gpt-3.5-turbo-1106', provider: 'OpenAI', promptPrice: 1.0, completionPrice: 2.0, billingType: '按量计费' },
  { id: 'gpt-3.5-turbo-16k', name: 'gpt-3.5-turbo-16k', provider: 'OpenAI', promptPrice: 3.0, completionPrice: 3.9, billingType: '按量计费' },
  { id: 'gpt-3.5-turbo-16k-0613', name: 'gpt-3.5-turbo-16k-0613', provider: 'OpenAI', promptPrice: 3.0, completionPrice: 3.9, billingType: '按量计费' },
  { id: 'gpt-4-32k', name: 'gpt-4-32k', provider: 'OpenAI', promptPrice: 60.0, completionPrice: 120.0, billingType: '按量计费' },
  { id: 'gpt-4-turbo', name: 'gpt-4-turbo', provider: 'OpenAI', promptPrice: 10.0, completionPrice: 30.0, billingType: '按量计费' },
  { id: 'gpt-4.1', name: 'gpt-4.1', provider: 'OpenAI', promptPrice: 2.0, completionPrice: 8.0, billingType: '按量计费' },
  { id: 'gpt-4.1-2025-04-14', name: 'gpt-4.1-2025-04-14', provider: 'OpenAI', promptPrice: 2.0, completionPrice: 8.0, billingType: '按量计费' },
  { id: 'gpt-4.1-mini', name: 'gpt-4.1-mini', provider: 'OpenAI', promptPrice: 0.4, completionPrice: 1.6, billingType: '按量计费' },
  { id: 'gpt-4.1-mini-2025-04-14', name: 'gpt-4.1-mini-2025-04-14', provider: 'OpenAI', promptPrice: 0.4, completionPrice: 1.6, billingType: '按量计费' },
  { id: 'gpt-4.1-nano', name: 'gpt-4.1-nano', provider: 'OpenAI', promptPrice: 0.1, completionPrice: 0.4, billingType: '按量计费' },
  { id: 'gpt-4.1-nano-2025-04-14', name: 'gpt-4.1-nano-2025-04-14', provider: 'OpenAI', promptPrice: 0.1, completionPrice: 0.4, billingType: '按量计费' },
  { id: 'gpt-4o', name: 'gpt-4o', provider: 'OpenAI', promptPrice: 2.5, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-4o-2024-05-13', name: 'gpt-4o-2024-05-13', provider: 'OpenAI', promptPrice: 5.0, completionPrice: 15.0, billingType: '按量计费' },
  { id: 'gpt-4o-2024-08-06', name: 'gpt-4o-2024-08-06', provider: 'OpenAI', promptPrice: 2.5, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-4o-2024-11-20', name: 'gpt-4o-2024-11-20', provider: 'OpenAI', promptPrice: 2.5, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-4o-mini', name: 'gpt-4o-mini', provider: 'OpenAI', promptPrice: 0.15, completionPrice: 0.6, billingType: '按量计费' },
  { id: 'gpt-4o-mini-2024-07-18', name: 'gpt-4o-mini-2024-07-18', provider: 'OpenAI', promptPrice: 0.15, completionPrice: 0.6, billingType: '按量计费' },
  { id: 'gpt-4o-mini-audio-preview', name: 'gpt-4o-mini-audio-preview', provider: 'OpenAI', promptPrice: 2.0, completionPrice: 8.0, billingType: '按量计费' },
  { id: 'gpt-4o-mini-transcribe', name: 'gpt-4o-mini-transcribe', provider: 'OpenAI', promptPrice: 1.5, completionPrice: 6.0, billingType: '按量计费' },
  { id: 'gpt-4o-transcribe', name: 'gpt-4o-transcribe', provider: 'OpenAI', promptPrice: 8.0, completionPrice: 16.0, billingType: '按量计费' },
  { id: 'gpt-5', name: 'gpt-5', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-5-2025-08-07', name: 'gpt-5-2025-08-07', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-5-chat-latest', name: 'gpt-5-chat-latest', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-5-codex', name: 'gpt-5-codex', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-5-mini', name: 'gpt-5-mini', provider: 'OpenAI', promptPrice: 0.25, completionPrice: 2.0, billingType: '按量计费' },
  { id: 'gpt-5-mini-2025-08-07', name: 'gpt-5-mini-2025-08-07', provider: 'OpenAI', promptPrice: 0.25, completionPrice: 2.0, billingType: '按量计费' },
  { id: 'gpt-5-nano', name: 'gpt-5-nano', provider: 'OpenAI', promptPrice: 0.05, completionPrice: 0.4, billingType: '按量计费' },
  { id: 'gpt-5-nano-2025-08-07', name: 'gpt-5-nano-2025-08-07', provider: 'OpenAI', promptPrice: 0.05, completionPrice: 0.4, billingType: '按量计费' },
  { id: 'gpt-5-pro', name: 'gpt-5-pro', provider: 'OpenAI', promptPrice: 15.0, completionPrice: 120.0, billingType: '按量计费' },
  { id: 'gpt-5-pro-2025-10-06', name: 'gpt-5-pro-2025-10-06', provider: 'OpenAI', promptPrice: 15.0, completionPrice: 120.0, billingType: '按量计费' },
  { id: 'gpt-5.1', name: 'gpt-5.1', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-5.1-2025-11-13', name: 'gpt-5.1-2025-11-13', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-5.1-chat-latest', name: 'gpt-5.1-chat-latest', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-5.1-codex-high', name: 'gpt-5.1-codex-high', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-5.1-codex-medium', name: 'gpt-5.1-codex-medium', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 10.0, billingType: '按量计费' },
  { id: 'gpt-5.1-codex-mini', name: 'gpt-5.1-codex-mini', provider: 'OpenAI', promptPrice: 1.25, completionPrice: 3.75, billingType: '按量计费' },
  { id: 'gpt-5.2', name: 'gpt-5.2', provider: 'OpenAI', promptPrice: 1.75, completionPrice: 14.0, billingType: '按量计费' },
  { id: 'gpt-5.2-2025-12-11', name: 'gpt-5.2-2025-12-11', provider: 'OpenAI', promptPrice: 1.75, completionPrice: 14.0, billingType: '按量计费' },
  { id: 'gpt-5.2-chat-latest', name: 'gpt-5.2-chat-latest', provider: 'OpenAI', promptPrice: 1.75, completionPrice: 14.0, billingType: '按量计费' },
  { id: 'gpt-5.2-pro', name: 'gpt-5.2-pro', provider: 'OpenAI', promptPrice: 21.0, completionPrice: 168.0, billingType: '按量计费' },
  { id: 'gpt-5.2-pro-2025-12-11', name: 'gpt-5.2-pro-2025-12-11', provider: 'OpenAI', promptPrice: 21.0, completionPrice: 168.0, billingType: '按量计费' },
  { id: 'gpt-5.3-chat-latest', name: 'gpt-5.3-chat-latest', provider: 'OpenAI', promptPrice: 1.75, completionPrice: 14.0, billingType: '按量计费' },
  { id: 'gpt-5.4', name: 'gpt-5.4', provider: 'OpenAI', promptPrice: 1.75, completionPrice: 10.5, billingType: '按量计费' },
  { id: 'gpt-5.4-mini', name: 'gpt-5.4-mini', provider: 'OpenAI', promptPrice: 0.525, completionPrice: 3.15, billingType: '按量计费' },
  { id: 'gpt-5.4-nano', name: 'gpt-5.4-nano', provider: 'OpenAI', promptPrice: 0.2, completionPrice: 1.25, billingType: '按量计费' },
  { id: 'gpt-5.4-nano-2026-03-17', name: 'gpt-5.4-nano-2026-03-17', provider: 'OpenAI', promptPrice: 0.2, completionPrice: 1.25, billingType: '按量计费' },
  { id: 'gpt-5.4-pro', name: 'gpt-5.4-pro', provider: 'OpenAI', promptPrice: 30.0, completionPrice: 180.0, billingType: '按量计费' },
  { id: 'gpt-5.5', name: 'gpt-5.5', provider: 'OpenAI', promptPrice: 3.5, completionPrice: 21.0, billingType: '按量计费' },
  { id: 'gpt-5.5-pro', name: 'gpt-5.5-pro', provider: 'OpenAI', promptPrice: 30.0, completionPrice: 180.0, billingType: '按量计费' },
  { id: 'gpt-5.5-xhigh', name: 'gpt-5.5-xhigh', provider: 'OpenAI', promptPrice: 3.5, completionPrice: 21.0, billingType: '按量计费' },
  { id: 'gpt-image-1', name: 'gpt-image-1', provider: 'OpenAI', promptPrice: 5.0, completionPrice: 40.0, billingType: '按量计费' },
  { id: 'gpt-image-1-mini', name: 'gpt-image-1-mini', provider: 'OpenAI', promptPrice: 2.0, completionPrice: 8.0, billingType: '按量计费' },
  { id: 'gpt-image-1.5', name: 'gpt-image-1.5', provider: 'OpenAI', promptPrice: 5.0, completionPrice: 32.0, billingType: '按量计费' },
  { id: 'gpt-image-1.5-2025-12-16', name: 'gpt-image-1.5-2025-12-16', provider: 'OpenAI', promptPrice: 5.0, completionPrice: 32.0, billingType: '按量计费' },
  { id: 'gpt-oss-120b', name: 'gpt-oss-120b', provider: 'OpenAI', promptPrice: 0.5, completionPrice: 2.0, billingType: '按量计费' },
  { id: 'gpt-oss-120b-1', name: 'gpt-oss-120b-1', provider: 'OpenAI', promptPrice: 0.5, completionPrice: 2.0, billingType: '按量计费' },
  { id: 'gpt-oss-20b', name: 'gpt-oss-20b', provider: 'OpenAI', promptPrice: 0.1, completionPrice: 0.4, billingType: '按量计费' },
  { id: 'chatgpt-image-latest', name: 'chatgpt-image-latest', provider: 'OpenAI', promptPrice: 5.0, completionPrice: 32.0, billingType: '按量计费' },
  { id: 'dall-e-3', name: 'dall-e-3', provider: 'OpenAI', promptPrice: 40.0, completionPrice: 40.0, billingType: '按量计费' },
  // ===== Anthropic =====
  { id: 'claude-fable-5', name: 'claude-fable-5', provider: 'Anthropic', promptPrice: 9.5, completionPrice: 47.5, billingType: '按量计费' },
  { id: 'claude-haiku-4-5-20251001', name: 'claude-haiku-4-5-20251001', provider: 'Anthropic', promptPrice: 0.95, completionPrice: 4.75, billingType: '按量计费' },
  { id: 'claude-haiku-4-5-20251001-thinking', name: 'claude-haiku-4-5-20251001-thinking', provider: 'Anthropic', promptPrice: 0.95, completionPrice: 4.75, billingType: '按量计费' },
  { id: 'claude-opus-4-1-20250805', name: 'claude-opus-4-1-20250805', provider: 'Anthropic', promptPrice: 14.25, completionPrice: 71.25, billingType: '按量计费' },
  { id: 'claude-opus-4-1-20250805-thinking', name: 'claude-opus-4-1-20250805-thinking', provider: 'Anthropic', promptPrice: 14.25, completionPrice: 71.25, billingType: '按量计费' },
  { id: 'claude-opus-4-5-20251101', name: 'claude-opus-4-5-20251101', provider: 'Anthropic', promptPrice: 4.75, completionPrice: 23.75, billingType: '按量计费' },
  { id: 'claude-opus-4-5-20251101-thinking', name: 'claude-opus-4-5-20251101-thinking', provider: 'Anthropic', promptPrice: 4.75, completionPrice: 23.75, billingType: '按量计费' },
  { id: 'claude-opus-4-6', name: 'claude-opus-4-6', provider: 'Anthropic', promptPrice: 4.75, completionPrice: 23.75, billingType: '按量计费' },
  { id: 'claude-opus-4-6-thinking', name: 'claude-opus-4-6-thinking', provider: 'Anthropic', promptPrice: 4.75, completionPrice: 23.75, billingType: '按量计费' },
  { id: 'claude-opus-4-7', name: 'claude-opus-4-7', provider: 'Anthropic', promptPrice: 4.75, completionPrice: 23.75, billingType: '按量计费' },
  { id: 'claude-opus-4-7-thinking', name: 'claude-opus-4-7-thinking', provider: 'Anthropic', promptPrice: 4.75, completionPrice: 23.75, billingType: '按量计费' },
  { id: 'claude-opus-4-8', name: 'claude-opus-4-8', provider: 'Anthropic', promptPrice: 4.75, completionPrice: 23.75, billingType: '按量计费' },
  { id: 'claude-sonnet-4-20250514', name: 'claude-sonnet-4-20250514', provider: 'Anthropic', promptPrice: 2.85, completionPrice: 14.25, billingType: '按量计费' },
  { id: 'claude-sonnet-4-20250514-thinking', name: 'claude-sonnet-4-20250514-thinking', provider: 'Anthropic', promptPrice: 2.85, completionPrice: 14.25, billingType: '按量计费' },
  { id: 'claude-sonnet-4-5-20250929', name: 'claude-sonnet-4-5-20250929', provider: 'Anthropic', promptPrice: 2.85, completionPrice: 14.25, billingType: '按量计费' },
  { id: 'claude-sonnet-4-5-20250929-thinking', name: 'claude-sonnet-4-5-20250929-thinking', provider: 'Anthropic', promptPrice: 2.85, completionPrice: 14.25, billingType: '按量计费' },
  { id: 'claude-sonnet-4-6', name: 'claude-sonnet-4-6', provider: 'Anthropic', promptPrice: 2.85, completionPrice: 14.25, billingType: '按量计费' },
  { id: 'claude-sonnet-4-6-thinking', name: 'claude-sonnet-4-6-thinking', provider: 'Anthropic', promptPrice: 2.85, completionPrice: 14.25, billingType: '按量计费' },
  { id: 'claude-sonnet-5', name: 'claude-sonnet-5', provider: 'Anthropic', promptPrice: 1.9, completionPrice: 9.5, billingType: '按量计费' },
  // ===== Gemini =====
  { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-flash-image', name: 'gemini-2.5-flash-image', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-flash-image-preview', name: 'gemini-2.5-flash-image-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-flash-lite', name: 'gemini-2.5-flash-lite', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-flash-lite-preview-09-2025', name: 'gemini-2.5-flash-lite-preview-09-2025', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-flash-nothinking', name: 'gemini-2.5-flash-nothinking', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-flash-preview', name: 'gemini-2.5-flash-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-flash-thinking', name: 'gemini-2.5-flash-thinking', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-pro', name: 'gemini-2.5-pro', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-pro-exp', name: 'gemini-2.5-pro-exp', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-pro-preview-06-05', name: 'gemini-2.5-pro-preview-06-05', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-pro-thinking', name: 'gemini-2.5-pro-thinking', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-2.5-pro-thinking-2025-03-25', name: 'gemini-2.5-pro-thinking-2025-03-25', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3-flash-preview', name: 'gemini-3-flash-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3-flash-preview-nothinking', name: 'gemini-3-flash-preview-nothinking', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3-flash-preview-thinking', name: 'gemini-3-flash-preview-thinking', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3-pro-image', name: 'gemini-3-pro-image', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3-pro-image-preview', name: 'gemini-3-pro-image-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3-pro-image-preview-1k', name: 'gemini-3-pro-image-preview-1k', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3-pro-image-preview-2k', name: 'gemini-3-pro-image-preview-2k', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3-pro-image-preview-4k', name: 'gemini-3-pro-image-preview-4k', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3-pro-preview', name: 'gemini-3-pro-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-flash-image', name: 'gemini-3.1-flash-image', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-flash-image-4k', name: 'gemini-3.1-flash-image-4k', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-flash-image-preview', name: 'gemini-3.1-flash-image-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-flash-image-preview-4k', name: 'gemini-3.1-flash-image-preview-4k', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-flash-lite', name: 'gemini-3.1-flash-lite', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'gemini-3.1-flash-lite-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-flash-preview', name: 'gemini-3.1-flash-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-pro-preview', name: 'gemini-3.1-pro-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-pro-preview-customtools', name: 'gemini-3.1-pro-preview-customtools', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.1-pro-preview-thinking', name: 'gemini-3.1-pro-preview-thinking', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-3.5-flash', name: 'gemini-3.5-flash', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-embedding-001', name: 'gemini-embedding-001', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'gemini-embedding-2-preview', name: 'gemini-embedding-2-preview', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'multimodal-embedding-v1', name: 'multimodal-embedding-v1', provider: 'Gemini', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  // ===== DeepSeek =====
  { id: 'deepseek-chat', name: 'deepseek-chat', provider: 'DeepSeek', promptPrice: 0.237, completionPrice: 0.95, billingType: '按量计费' },
  { id: 'deepseek-ocr', name: 'deepseek-ocr', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-r1', name: 'deepseek-r1', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-r1-0528', name: 'deepseek-r1-0528', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-r1-250528', name: 'deepseek-r1-250528', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-reasoner', name: 'deepseek-reasoner', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v3', name: 'deepseek-v3', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v3-0324', name: 'deepseek-v3-0324', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v3-1-250821', name: 'deepseek-v3-1-250821', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v3-20250324', name: 'deepseek-v3-20250324', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v3-250324', name: 'deepseek-v3-250324', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v3.1', name: 'deepseek-v3.1', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v3.1-terminus', name: 'deepseek-v3.1-terminus', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v3.2', name: 'deepseek-v3.2', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v3.2-exp', name: 'deepseek-v3.2-exp', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'deepseek-v4-pro', name: 'deepseek-v4-pro', provider: 'DeepSeek', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  // ===== Moonshot =====
  { id: 'moonshot-v1-8k', name: 'moonshot-v1-8k', provider: 'Moonshot', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'moonshot-v1-32k', name: 'moonshot-v1-32k', provider: 'Moonshot', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'moonshot-v1-128k', name: 'moonshot-v1-128k', provider: 'Moonshot', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'moonshot-v1', name: 'moonshot-v1', provider: 'Moonshot', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  // ===== 智谱 =====
  { id: 'glm-4.5', name: 'glm-4.5', provider: '智谱', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'glm-4.5-air', name: 'glm-4.5-air', provider: '智谱', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'glm-4.5v', name: 'glm-4.5v', provider: '智谱', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'glm-4.6', name: 'glm-4.6', provider: '智谱', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'glm-4.7', name: 'glm-4.7', provider: '智谱', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'glm-5', name: 'glm-5', provider: '智谱', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'glm-5.1', name: 'glm-5.1', provider: '智谱', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'glm-5.2', name: 'glm-5.2', provider: '智谱', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  // ===== 通义千问 =====
  { id: 'qwen-long', name: 'qwen-long', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-max', name: 'qwen-max', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-max-latest', name: 'qwen-max-latest', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-max-longcontext', name: 'qwen-max-longcontext', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-mt-plus', name: 'qwen-mt-plus', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-mt-turbo', name: 'qwen-mt-turbo', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-plus', name: 'qwen-plus', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-plus-2025-07-14', name: 'qwen-plus-2025-07-14', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-plus-2025-09-11', name: 'qwen-plus-2025-09-11', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-plus-latest', name: 'qwen-plus-latest', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-turbo', name: 'qwen-turbo', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-turbo-2025-07-15', name: 'qwen-turbo-2025-07-15', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-turbo-latest', name: 'qwen-turbo-latest', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-vl-max', name: 'qwen-vl-max', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-vl-max-latest', name: 'qwen-vl-max-latest', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-vl-ocr', name: 'qwen-vl-ocr', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-vl-ocr-2025-11-20', name: 'qwen-vl-ocr-2025-11-20', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-vl-ocr-latest', name: 'qwen-vl-ocr-latest', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-vl-plus', name: 'qwen-vl-plus', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen-vl-plus-latest', name: 'qwen-vl-plus-latest', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen2-72b-instruct', name: 'qwen2-72b-instruct', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-235b-a22b', name: 'qwen3-235b-a22b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-235b-a22b-instruct-2507', name: 'qwen3-235b-a22b-instruct-2507', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-235b-a22b-thinking-2507', name: 'qwen3-235b-a22b-thinking-2507', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-30b-a3b', name: 'qwen3-30b-a3b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-30b-a3b-instruct-2507', name: 'qwen3-30b-a3b-instruct-2507', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-30b-a3b-thinking-2507', name: 'qwen3-30b-a3b-thinking-2507', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-32b', name: 'qwen3-32b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-coder-480b-a35b-instruct', name: 'qwen3-coder-480b-a35b-instruct', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-coder-flash', name: 'qwen3-coder-flash', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-coder-plus', name: 'qwen3-coder-plus', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-coder-plus-2025-07-22', name: 'qwen3-coder-plus-2025-07-22', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-coder-plus-2025-09-23', name: 'qwen3-coder-plus-2025-09-23', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-max', name: 'qwen3-max', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-max-2025-09-23', name: 'qwen3-max-2025-09-23', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-max-preview', name: 'qwen3-max-preview', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-next-80b-a3b-instruct', name: 'qwen3-next-80b-a3b-instruct', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-omni-flash', name: 'qwen3-omni-flash', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-omni-flash-2025-09-15', name: 'qwen3-omni-flash-2025-09-15', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-vl-235b-a22b-instruct', name: 'qwen3-vl-235b-a22b-instruct', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-vl-235b-a22b-thinking', name: 'qwen3-vl-235b-a22b-thinking', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-vl-30b-a3b-thinking', name: 'qwen3-vl-30b-a3b-thinking', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-vl-32b-thinking', name: 'qwen3-vl-32b-thinking', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-vl-embedding', name: 'qwen3-vl-embedding', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-vl-flash', name: 'qwen3-vl-flash', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-vl-flash-2025-10-15', name: 'qwen3-vl-flash-2025-10-15', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-vl-plus', name: 'qwen3-vl-plus', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3-vl-plus-2025-09-23', name: 'qwen3-vl-plus-2025-09-23', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.5-122b-a10b', name: 'qwen3.5-122b-a10b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.5-27b', name: 'qwen3.5-27b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.5-35b-a3b', name: 'qwen3.5-35b-a3b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.5-397b-a17b', name: 'qwen3.5-397b-a17b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.5-flash', name: 'qwen3.5-flash', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.5-flash-2026-02-23', name: 'qwen3.5-flash-2026-02-23', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.5-plus', name: 'qwen3.5-plus', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.5-plus-2026-02-15', name: 'qwen3.5-plus-2026-02-15', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.6-27b', name: 'qwen3.6-27b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.6-35b-a3b', name: 'qwen3.6-35b-a3b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.6-flash', name: 'qwen3.6-flash', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.6-max-preview', name: 'qwen3.6-max-preview', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.6-plus', name: 'qwen3.6-plus', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwen3.7-max', name: 'qwen3.7-max', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwq-32b', name: 'qwq-32b', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwq-plus', name: 'qwq-plus', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwq-plus-2025-03-05', name: 'qwq-plus-2025-03-05', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'qwq-plus-latest', name: 'qwq-plus-latest', provider: '通义千问', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  // ===== MiniMax =====
  { id: 'MiniMax-M2.1', name: 'MiniMax-M2.1', provider: 'MiniMax', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'MiniMax-M2.5', name: 'MiniMax-M2.5', provider: 'MiniMax', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'MiniMax-M2.5-lightning', name: 'MiniMax-M2.5-lightning', provider: 'MiniMax', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'MiniMax-M2.7', name: 'MiniMax-M2.7', provider: 'MiniMax', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'MiniMax-M2.7-highspeed', name: 'MiniMax-M2.7-highspeed', provider: 'MiniMax', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'MiniMax-M3', name: 'MiniMax-M3', provider: 'MiniMax', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  // ===== xAI =====
  { id: 'grok-2-image', name: 'grok-2-image', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-2-image-1212', name: 'grok-2-image-1212', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-2-image-latest', name: 'grok-2-image-latest', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-4.20-beta', name: 'grok-4.20-beta', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-4.20-beta-0309-non-reasoning', name: 'grok-4.20-beta-0309-non-reasoning', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-4.20-beta-0309-reasoning', name: 'grok-4.20-beta-0309-reasoning', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-4.20-multi-agent-beta-0309', name: 'grok-4.20-multi-agent-beta-0309', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-4.3', name: 'grok-4.3', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-code-fast', name: 'grok-code-fast', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-code-fast-1', name: 'grok-code-fast-1', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'grok-code-fast-1-0825', name: 'grok-code-fast-1-0825', provider: 'xAI', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  // ===== 豆包 =====
  { id: 'doubao-seed-1-6-250615', name: 'doubao-seed-1-6-250615', provider: '豆包', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'doubao-seed-1-6-251015', name: 'doubao-seed-1-6-251015', provider: '豆包', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'doubao-seed-1-8-251228', name: 'doubao-seed-1-8-251228', provider: '豆包', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'doubao-seedream-4-0-250828', name: 'doubao-seedream-4-0-250828', provider: '豆包', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'doubao-seedream-4-5-251128', name: 'doubao-seedream-4-5-251128', provider: '豆包', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'doubao-seedream-5-0-260128', name: 'doubao-seedream-5-0-260128', provider: '豆包', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'seed-1-6-250615', name: 'seed-1-6-250615', provider: '豆包', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  { id: 'seed-1-6-flash-250615', name: 'seed-1-6-flash-250615', provider: '豆包', promptPrice: 0.0, completionPrice: 0.0, billingType: '按量计费' },
  // ===== 其他 =====
  { id: 'bge-reranker-v2-m3', name: 'bge-reranker-v2-m3', provider: '其他', promptPrice: 0.009, completionPrice: 0.009, billingType: '按量计费' },
  { id: 'chat-latest', name: 'chat-latest', provider: '其他', promptPrice: 5.0, completionPrice: 30.0, billingType: '按量计费' },
  // ... 更多模型可继续添加
];

// ========== 供应商图标映射 ==========
const providerIcons: Record<string, React.ReactNode> = {
  OpenAI: <OpenAI size={20} />,
  Anthropic: <Claude size={20} />,
  Gemini: <Gemini size={20} />,
  DeepSeek: <DeepSeek size={20} />,
  Moonshot: <StarOutlined size={20} />,
  智谱: <StarOutlined size={20} />,
  通义千问: <Qwen size={20} />,
  MiniMax: <StarOutlined size={20} />,
  xAI: <StarOutlined size={20} />,
  豆包: <StarOutlined size={20} />,
  其他: <StarOutlined size={20} />,
};

// ========== 供应商颜色映射 ==========
const providerColors: Record<string, string> = {
  OpenAI: '#10a37f',
  Anthropic: '#d97706',
  Gemini: '#4285F4',
  DeepSeek: '#06b6d4',
  Moonshot: '#8b5cf6',
  智谱: '#6366f1',
  通义千问: '#ff6b00',
  MiniMax: '#ec4899',
  xAI: '#ff6b35',
  豆包: '#f97316',
  其他: '#6b7280',
};

// ========== 供应商统计数据 ==========
const providerStats: Record<string, number> = {
  OpenAI: 95,
  Anthropic: 19,
  Gemini: 36,
  Moonshot: 4,
  智谱: 8,
  通义千问: 57,
  DeepSeek: 17,
  MiniMax: 6,
  xAI: 11,
  豆包: 8,
  其他: 52,
};

// ========== 主组件 ==========
export default function AssetsPage() {
  const [selectedProvider, setSelectedProvider] = useState('all');

  // 分类选项
  const categoryOptions = [
    { value: 'all', label: '显示所有' },
    { value: 'OpenAI', label: `OpenAI ${providerStats.OpenAI || 0}个` },
    { value: 'Anthropic', label: `Anthropic ${providerStats.Anthropic || 0}个` },
    { value: 'Gemini', label: `Gemini ${providerStats.Gemini || 0}个` },
    { value: 'Moonshot', label: `Moonshot ${providerStats.Moonshot || 0}个` },
    { value: '智谱', label: `智谱 ${providerStats['智谱'] || 0}个` },
    { value: '通义千问', label: `通义千问 ${providerStats['通义千问'] || 0}个` },
    { value: 'DeepSeek', label: `DeepSeek ${providerStats.DeepSeek || 0}个` },
    { value: 'MiniMax', label: `MiniMax ${providerStats.MiniMax || 0}个` },
    { value: 'xAI', label: `xAI ${providerStats.xAI || 0}个` },
    { value: '豆包', label: `豆包 ${providerStats['豆包'] || 0}个` },
    { value: '其他', label: `其他 ${providerStats['其他'] || 0}个` },
  ];

  // 筛选模型
  const filteredModels = useMemo(() => {
    if (selectedProvider === 'all') return modelData;
    return modelData.filter(m => m.provider === selectedProvider);
  }, [selectedProvider]);

  // 获取当前选中的供应商标签
  const getProviderLabel = (provider: string) => {
    const found = categoryOptions.find(opt => opt.value === provider);
    return found ? found.label : provider;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={2} style={{ margin: 0 }}>模型总览</Title>
          <Select
            value={selectedProvider}
            onChange={setSelectedProvider}
            style={{ width: 200 }}
            options={categoryOptions}
            placeholder="选择分类"
          />
        </div>
        <Text type="secondary">
          共 {filteredModels.length} 个模型
        </Text>
      </div>

      <Divider style={{ margin: '0 0 20px 0' }} />

      <Row gutter={[16, 16]}>
        {filteredModels.map((model) => {
          const IconComponent = providerIcons[model.provider] || <StarOutlined size={20} />;
          const color = providerColors[model.provider] || '#6b7280';

          return (
            <Col key={model.id} xs={24} sm={12} md={8} lg={6} xl={4}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  border: '1px solid #f0f0f0',
                  borderRadius: '12px',
                  transition: 'all 0.3s',
                }}
                bodyStyle={{ padding: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ color: color }}>
                    {IconComponent}
                  </div>
                  <Text strong style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {model.name}
                  </Text>
                </div>

                <Tag color={color} style={{ marginBottom: 8 }}>
                  {model.provider}
                </Tag>

                <div style={{ fontSize: 12, color: '#666' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>提示</span>
                    <span>${model.promptPrice.toFixed(3)} / 1M tokens</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>补全</span>
                    <span>${model.completionPrice.toFixed(3)} / 1M tokens</span>
                  </div>
                </div>

                <Tag color="#f0f0f0" style={{ marginTop: 8, fontSize: 11 }}>
                  {model.billingType}
                </Tag>
              </Card>
            </Col>
          );
        })}
      </Row>

      {filteredModels.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          暂无模型
        </div>
      )}
    </div>
  );
}