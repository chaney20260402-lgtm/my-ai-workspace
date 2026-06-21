'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ImageGenerator from '../components/ImageGenerator';
import { Spin, Result, Button } from 'antd';
import Link from 'next/link';

// 定义工作流类型
interface Workflow {
  id: number;
  name: string;
  model: string;
  size: string;
  prompt: string;
  createdAt: string;
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId');
  const [workflow, setWorkflow] = useState<Workflow | null>(null);  // ← 修复1：显式类型
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workflowId) {
      const saved = localStorage.getItem('workflows');
      if (saved) {
        const workflows: Workflow[] = JSON.parse(saved);  // ← 修复2：类型声明
        const found = workflows.find((w: Workflow) => w.id === parseInt(workflowId));  // ← 修复3：参数类型
        setWorkflow(found || null);
      }
    }
    setLoading(false);
  }, [workflowId]);

  if (loading) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Result
          status="404"
          title="未找到工作流"
          subTitle="请检查工作流ID是否正确，或返回工作流列表重新选择。"
          extra={
            <Button type="primary">
              <Link href="/workspace/workflow">返回工作流列表</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // 将模型名称映射到组件内部使用的值
  const modelMap: Record<string, string> = {
    'Nano Banana Pro': 'nano-banana',
    'GPT Image 2': 'gpt-image-2',
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2>运行工作流：{workflow.name}</h2>
      <ImageGenerator
        initialPrompt={workflow.prompt}
        initialModel={modelMap[workflow.model] || 'nano-banana'}
        initialSize={workflow.size || '2K'}
        onGenerateSuccess={(imageUrl) => {
          // 生成成功后保存到资产库
          const saved = localStorage.getItem('userAssets');
          const assets = saved ? JSON.parse(saved) : [];
          const newAsset = {
            id: Date.now(),
            name: `生成_${new Date().toLocaleString()}`,
            url: imageUrl,
            type: 'image',
          };
          assets.push(newAsset);
          localStorage.setItem('userAssets', JSON.stringify(assets));
          console.log('已保存到资产库', newAsset);
        }}
      />
    </div>
  );
}