'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button, Space, Typography, Drawer, Form, Input, Select, message, Spin, Modal, Upload, Tag, Divider } from 'antd';
import { 
  PlusOutlined, 
  VideoCameraOutlined, 
  FileImageOutlined, 
  FormOutlined, 
  EyeOutlined, 
  DeleteOutlined, 
  PlayCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useCredits } from '@/app/contexts/CreditsContext';
import AnimatedEdge from './edges/AnimatedEdge';
import { calculateVideoCredits } from '@/lib/video-credits';

const { Title, Text } = Typography;
const { Option } = Select;

// ============================================================
// 模型配置
// ============================================================
const VIDEO_MODELS = [
  { 
    value: 'grok-imagine-video', 
    label: 'Grok Imagine', 
    durations: [5, 8, 10, 15], 
    aspectRatios: ['16:9', '9:16', '1:1'],
    maxDuration: 15,
    resolutions: ['480p', '720p'],
    description: 'xAI 视频生成，支持长视频',
  },
  { 
    value: 'grok-imagine-video-1.5-preview', 
    label: 'Grok Imagine 1.5', 
    durations: [5, 8, 10, 15], 
    aspectRatios: ['16:9', '9:16', '1:1'],
    maxDuration: 15,
    resolutions: ['480p', '720p', '1080p'],
    description: 'xAI 最新视频模型',
  },
  { 
    value: 'wan2.7', 
    label: 'Wan2.7 视频生成', 
    durations: [4, 6, 8, 10, 12], 
    aspectRatios: ['16:9', '9:16', '1:1'],
    maxDuration: 12,
    resolutions: ['480p', '720p', '1080p'],
    description: '阿里云万象，支持文生/图生/参考生，音频驱动',
    provider: 'apiyi',
  },
  { 
    value: 'veo-3.1-official', 
    label: 'VEO 3.1 官转', 
    durations: [4, 6, 8], 
    aspectRatios: ['16:9', '9:16', '1:1'],
    maxDuration: 8,
    resolutions: ['480p', '720p', '1080p'],
    description: 'Google AI Studio 官方端点，声画同步，支持真人',
    provider: 'apiyi',
  },
  { 
    value: 'happyhorse-1.0', 
    label: 'HappyHorse 1.0', 
    durations: [4, 6, 8, 10, 12], 
    aspectRatios: ['16:9', '9:16', '1:1'],
    maxDuration: 12,
    resolutions: ['480p', '720p', '1080p'],
    description: '阿里云，多参考图主体保持（最多9张）',
    provider: 'apiyi',
  },
  { 
    value: 'wan2.6', 
    label: 'Wan2.6 视频生成', 
    durations: [4, 6, 8, 10, 12], 
    aspectRatios: ['16:9', '9:16', '1:1'],
    maxDuration: 12,
    resolutions: ['480p', '720p', '1080p'],
    description: '与 Wan2.7 共用端点，含低延迟档',
    provider: 'apiyi',
  },
];

const ALL_DURATIONS = [4, 5, 6, 8, 10, 12, 15];
const DURATION_OPTIONS = ALL_DURATIONS;

const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '16:9 (横屏)', icon: '↔️' },
  { value: '9:16', label: '9:16 (竖屏)', icon: '↕️' },
  { value: '1:1', label: '1:1 (方形)', icon: '⬜' },
  { value: '4:3', label: '4:3 (传统)', icon: '📺' },
  { value: '3:4', label: '3:4 (竖屏)', icon: '📱' },
];

const RESOLUTION_OPTIONS = [
  { value: '480p', label: '480p' },
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
];

const getModelsByDuration = (duration: number) => {
  return VIDEO_MODELS.filter(m => m.durations.includes(duration));
};

const getDurationsByModel = (modelValue: string) => {
  const model = VIDEO_MODELS.find(m => m.value === modelValue);
  return model ? model.durations : [];
};

const getResolutionsByModel = (modelValue: string) => {
  const model = VIDEO_MODELS.find(m => m.value === modelValue);
  return model?.resolutions || ['480p', '720p'];
};

// ============================================================
// 自定义节点组件
// ============================================================
import { Handle, Position } from 'reactflow';

const TextInputNode = ({ data }: { data: any }) => {
  return (
    <div style={{ padding: '10px 14px', background: '#fff', border: '2px solid #1890ff', borderRadius: 8, minWidth: 150, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Handle type="source" position={Position.Right} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FormOutlined style={{ color: '#1890ff' }} />
        <strong>文本输入</strong>
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: '#666', wordBreak: 'break-all' }}>
        {data.prompt ? `"${data.prompt.substring(0, 30)}${data.prompt.length > 30 ? '...' : ''}"` : '点击编辑提示词'}
      </div>
    </div>
  );
};

const ImageNode = ({ data }: { data: any }) => {
  return (
    <div style={{ padding: '10px 14px', background: '#fff', border: '2px solid #52c41a', borderRadius: 8, minWidth: 120, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Handle type="source" position={Position.Right} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileImageOutlined style={{ color: '#52c41a' }} />
        <strong>图片参考</strong>
      </div>
      {data.imageUrl && (
        <img src={data.imageUrl} alt="参考图" style={{ width: 80, height: 80, objectFit: 'cover', marginTop: 4, borderRadius: 4 }} />
      )}
      {!data.imageUrl && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>上传图片</div>}
      {data.prompt && (
        <div style={{ fontSize: 12, color: '#666', marginTop: 4, wordBreak: 'break-all' }}>
          📝 {data.prompt.substring(0, 30)}...
        </div>
      )}
    </div>
  );
};

const VideoGenNode = ({ data }: { data: any }) => {
  const statusColor = data.status === 'completed' ? '#52c41a' : data.status === 'processing' ? '#faad14' : '#999';
  const statusText = data.status === 'completed' ? '✅ 完成' : data.status === 'processing' ? '⏳ 生成中...' : '等待触发';
  const modelLabel = VIDEO_MODELS.find(m => m.value === data.model)?.label || data.model || '未选择';
  return (
    <div style={{ padding: '10px 14px', background: '#fff', border: '2px solid #faad14', borderRadius: 8, minWidth: 180, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <VideoCameraOutlined style={{ color: '#faad14' }} />
        <strong>视频生成</strong>
      </div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
        模型: {modelLabel}
      </div>
      {data.duration && <div style={{ fontSize: 12, color: '#666' }}>时长: {data.duration}s</div>}
      {data.aspectRatio && <div style={{ fontSize: 12, color: '#666' }}>比例: {data.aspectRatio}</div>}
      {data.resolution && <div style={{ fontSize: 12, color: '#666' }}>分辨率: {data.resolution}</div>}
      <div style={{ fontSize: 12, color: statusColor, marginTop: 2 }}>{statusText}</div>
    </div>
  );
};

const VideoPreviewNode = ({ data }: { data: any }) => {
  return (
    <div style={{ padding: '10px 14px', background: '#fff', border: '2px solid #722ed1', borderRadius: 8, minWidth: 200, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <EyeOutlined style={{ color: '#722ed1' }} />
        <strong>视频预览</strong>
      </div>
      {data.videoUrl ? (
        <video controls style={{ width: 180, maxHeight: 120, marginTop: 4, borderRadius: 4 }} src={data.videoUrl} />
      ) : (
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>等待视频...</div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  textInput: TextInputNode,
  imageInput: ImageNode,
  videoGen: VideoGenNode,
  videoPreview: VideoPreviewNode,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
};

// ============================================================
// 主组件
// ============================================================
export default function VideoCanvas() {
  const { setCredits } = useCredits();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ============================================================
  // 顶部工具栏配置状态（用户可见）
  // ============================================================
  const [selectedModel, setSelectedModel] = useState<string>('veo-3.1-official');
  const [selectedDuration, setSelectedDuration] = useState<number>(8);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('16:9');
  const [selectedResolution, setSelectedResolution] = useState<string>('720p');

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 联动的可用选项
  const availableModels = useMemo(() => {
    return getModelsByDuration(selectedDuration);
  }, [selectedDuration]);

  const availableDurations = useMemo(() => {
    return getDurationsByModel(selectedModel);
  }, [selectedModel]);

  const availableResolutions = useMemo(() => {
    return getResolutionsByModel(selectedModel);
  }, [selectedModel]);

  // 自动打开配置抽屉：添加节点后选中并打开抽屉
  useEffect(() => {
    if (selectedNode && selectedNode.type === 'videoGen') {
      setDrawerOpen(true);
      form.setFieldsValue(selectedNode.data);
    }
  }, [selectedNode, form]);

  // 顶部工具栏配置变化时，自动同步到选中的视频生成节点
  useEffect(() => {
    if (selectedNode && selectedNode.type === 'videoGen') {
      const updatedData = {
        ...selectedNode.data,
        model: selectedModel,
        duration: selectedDuration,
        aspectRatio: selectedAspectRatio,
        resolution: selectedResolution,
      };
      // 只更新 data，不触发重新渲染循环
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id ? { ...node, data: updatedData } : node
        )
      );
    }
  }, [selectedModel, selectedDuration, selectedAspectRatio, selectedResolution, selectedNode, setNodes]);

  // 当模型变化时，确保当前时长和分辨率在支持列表中
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    const durations = getDurationsByModel(value);
    if (durations.length > 0 && !durations.includes(selectedDuration)) {
      setSelectedDuration(durations[0]);
    }
    const resolutions = getResolutionsByModel(value);
    if (resolutions.length > 0 && !resolutions.includes(selectedResolution)) {
      setSelectedResolution(resolutions[0]);
    }
  };

  const handleDurationChange = (value: number) => {
    setSelectedDuration(value);
    const models = getModelsByDuration(value);
    if (models.length > 0 && !models.some(m => m.value === selectedModel)) {
      setSelectedModel(models[0].value);
    }
    // 分辨率也要检查是否支持
    const resolutions = getResolutionsByModel(selectedModel);
    if (!resolutions.includes(selectedResolution)) {
      setSelectedResolution(resolutions[0]);
    }
  };

  // 计算所需积分（用于顶部显示）
  const imageCount = useMemo(() => {
    // 检查当前选中的视频生成节点是否有图片
    if (selectedNode && selectedNode.type === 'videoGen') {
      const connectedEdges = edges.filter(e => e.target === selectedNode.id);
      for (const edge of connectedEdges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.type === 'imageInput' && sourceNode.data.imageUrl) {
          return 1;
        }
      }
    }
    return 0;
  }, [selectedNode, edges, nodes]);

  const requiredCredits = useMemo(() => {
    return calculateVideoCredits(selectedModel, selectedResolution, selectedDuration, imageCount);
  }, [selectedModel, selectedResolution, selectedDuration, imageCount]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    form.setFieldsValue(node.data);
    // 自动打开抽屉
    if (node.type === 'videoGen' || node.type === 'textInput' || node.type === 'imageInput') {
      setDrawerOpen(true);
    }
  }, [form]);

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: type === 'videoGen' ? { 
        model: selectedModel, 
        duration: selectedDuration, 
        aspectRatio: selectedAspectRatio,
        resolution: selectedResolution,
      } : {},
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNode(newNode);
    // 视频生成节点自动打开抽屉
    if (type === 'videoGen') {
      setDrawerOpen(true);
      form.setFieldsValue(newNode.data);
    }
    message.success(`已添加 ${type === 'textInput' ? '文本输入' : type === 'imageInput' ? '图片参考' : type === 'videoGen' ? '视频生成' : '预览'} 节点`);
  };

  const onSaveNode = () => {
    if (!selectedNode) return;
    const values = form.getFieldsValue();
    if (selectedNode.type === 'videoGen') {
      if (values.duration && values.model) {
        const model = VIDEO_MODELS.find(m => m.value === values.model);
        if (model && !model.durations.includes(values.duration)) {
          message.warning(`模型 ${model.label} 不支持 ${values.duration}秒时长`);
          return;
        }
        // 同步更新顶部工具栏状态
        setSelectedModel(values.model);
        setSelectedDuration(values.duration);
        setSelectedAspectRatio(values.aspectRatio || selectedAspectRatio);
        setSelectedResolution(values.resolution || selectedResolution);
      }
    }
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { ...node.data, ...values } } : node
      )
    );
    setDrawerOpen(false);
    message.success('节点配置已保存');
  };

  const onDeleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setDrawerOpen(false);
    message.success('已删除节点');
  };

 const handleImageUpload = async (file: File) => {
  setUploading(true);
  try {
    const res = await fetch(`/api/upload?filename=${Date.now()}-${file.name}`, {
      method: 'POST',
      body: file,
    });
    const data = await res.json();

    if (data.success && data.url) {
      if (selectedNode) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNode.id
              ? { ...node, data: { ...node.data, imageUrl: data.url } }
              : node
          )
        );
        message.success('图片上传成功！✅');
        console.log('✅ 上传的图片 URL:', data.url);
      }
      setDrawerOpen(false);
    } else {
      message.error(data.error || '上传失败');
    }
  } catch (error) {
    console.error('上传失败:', error);
    message.error('图片上传失败');
  } finally {
    setUploading(false);
  }
};

// ============================================================
// 执行工作流（使用顶部工具栏的配置）
// ============================================================
const executeWorkflow = async () => {
  const genNodes = nodes.filter(n => n.type === 'videoGen');
  if (genNodes.length === 0) {
    message.warning('画布上没有视频生成节点');
    return;
  }

  const targetNode = genNodes.find(n => n.data.status !== 'completed');
  if (!targetNode) {
    message.info('所有视频生成任务已完成');
    return;
  }

  const connectedEdges = edges.filter(e => e.target === targetNode.id);
  let prompt = '';
  let imageUrl = '';

  console.log('🔍 ===== 开始获取节点数据 =====');
  console.log('🔍 连接到目标节点的边数:', connectedEdges.length);
  
  for (const edge of connectedEdges) {
    console.log('🔍 边缘:', edge);
    const sourceNode = nodes.find(n => n.id === edge.source);
    console.log('🔍 源节点:', sourceNode);
    
    if (sourceNode) {
      console.log('🔍 节点类型:', sourceNode.type);
      console.log('🔍 节点数据:', sourceNode.data);
      
      if (sourceNode.type === 'textInput') {
        prompt = sourceNode.data.prompt || '';
        console.log('🔍 从文本节点获取 prompt:', prompt);
      } else if (sourceNode.type === 'imageInput') {
        imageUrl = sourceNode.data.imageUrl || '';
        console.log('🔍 从图片节点获取 imageUrl:', imageUrl);
        console.log('🔍 imageUrl 长度:', imageUrl.length);
        console.log('🔍 是否以 https:// 开头:', imageUrl.startsWith('https://'));
        console.log('🔍 是否包含 public.blob.vercel-storage.com:', imageUrl.includes('public.blob.vercel-storage.com'));
        
        if (sourceNode.data.prompt && !prompt) {
          prompt = sourceNode.data.prompt || '';
          console.log('🔍 从图片节点获取 prompt:', prompt);
        }
      }
    }
  }

  console.log('🔍 ===== 最终获取到的数据 =====');
  console.log('  - prompt:', prompt);
  console.log('  - imageUrl:', imageUrl);
  console.log('  - imageUrl 是否为空:', !imageUrl);
  console.log('  - imageUrl 是否以 https:// 开头:', imageUrl?.startsWith('https://'));

  const isGrokPureText = selectedModel === 'grok-imagine-video';
  const isGrokImage = selectedModel === 'grok-imagine-video-1.5-preview';
  const isVeo = selectedModel.startsWith('veo');

  if ((isGrokPureText || isGrokImage) && imageUrl && !prompt) {
    const imageNode = nodes.find(n => n.type === 'imageInput' && n.data.imageUrl === imageUrl);
    if (imageNode?.data.prompt) {
      prompt = imageNode.data.prompt;
      console.log('✅ 从图片节点获取描述:', prompt);
    }
  }

  if (isGrokPureText) {
    if (!prompt) {
      message.warning('请填写提示词（文字节点或图片节点的描述）');
      return;
    }
    console.log('🔵 Grok 纯文本模式，无需图片');
  }

  if (isGrokImage) {
    if (!prompt) {
      message.warning('请填写提示词（文字节点或图片节点的描述）');
      return;
    }
    if (!imageUrl) {
      message.warning('Grok Imagine 1.5 需要提供参考图片，请连接图片节点');
      return;
    }
    if (!imageUrl.startsWith('https://')) {
      console.warn('⚠️ imageUrl 不是 HTTPS URL:', imageUrl);
      message.warning('图片 URL 格式不正确，请重新上传图片');
      return;
    }
    console.log('🟣 Grok 图生视频模式，图片已准备:', imageUrl);
  }

  if (isVeo) {
    if (!prompt) {
      message.warning('请填写提示词');
      return;
    }
    console.log('🟢 Veo 模式，纯文本');
  }

  console.log('🔍 工作流参数:');
  console.log('  - prompt:', prompt);
  console.log('  - imageUrl:', imageUrl);
  console.log('  - selectedModel:', selectedModel);
  console.log('  - selectedResolution:', selectedResolution);

  setProcessing(true);
  try {
    const isGrok = selectedModel.startsWith('grok');
    const apiEndpoint = isGrok ? '/api/video/grok' : '/api/video/generate';

    setNodes((nds) =>
      nds.map((node) =>
        node.id === targetNode.id ? { ...node, data: { ...node.data, status: 'processing' } } : node
      )
    );

    console.log('🔵 正在调用 API:', apiEndpoint);
    console.log('🔵 请求体:', { prompt, imageUrl, model: selectedModel, duration: selectedDuration, resolution: selectedResolution });

    const res = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        imageUrl,
        model: selectedModel,
        duration: selectedDuration,
        aspectRatio: selectedAspectRatio,
        resolution: selectedResolution,
      }),
    });

    console.log('🔵 API 响应状态:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('❌ API 响应错误:', res.status, text);
      let errorMsg = `请求失败 (${res.status})`;
      try {
        const errorData = JSON.parse(text);
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch {
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || '提交失败');
    }

    console.log('✅ API 调用成功，generationId:', data.generationId);

    const generationId = data.generationId;
    message.info(`任务已提交，ID: ${generationId}`);

    if (isGrok) {
      await pollGrokResult(generationId, targetNode.id, targetNode.position);
    } else {
      await pollVideoResult(generationId, targetNode.id, targetNode.position);
    }

  } catch (error: any) {
    console.error('❌ 执行工作流失败:', error);
    message.error(error.message || '生成失败');
    setNodes((nds) =>
      nds.map((node) =>
        node.id === targetNode.id ? { ...node, data: { ...node.data, status: 'failed' } } : node
      )
    );
  } finally {
    setProcessing(false);
  }
};

// ============================================================
// pollVideoResult（API 易轮询）
// ============================================================
const pollVideoResult = async (generationId: string, nodeId: string, targetPos: { x: number; y: number }) => {
  let attempts = 0;
  const maxAttempts = 60;

  const poll = async () => {
    attempts++;
    console.log(`🔵 轮询第 ${attempts} 次，generationId: ${generationId}`);

    try {
      const res = await fetch(`/api/video/status?generationId=${generationId}`);
      const data = await res.json();

      console.log(`📥 轮询响应 (第 ${attempts} 次):`, JSON.stringify(data, null, 2));

      if (data.status === 'completed' || data.status === 'succeeded') {
        const videoUrl = data.videoUrl || data.video_url || null;
        if (videoUrl) {
          if (data.credits !== undefined) {
            setCredits(data.credits);
          }
          // 更新生成节点
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, status: 'completed', videoUrl: videoUrl } }
                : node
            )
          );
          // 创建预览节点并添加边
          const previewNodeId = `preview-${Date.now()}`;
          const previewNode: Node = {
            id: previewNodeId,
            type: 'videoPreview',
            position: { x: targetPos.x + 200, y: targetPos.y + 50 },
            data: { videoUrl: videoUrl },
          };
          setNodes((nds) => nds.concat(previewNode));
          // 添加边
          const newEdge: Edge = {
            id: `edge-${nodeId}-${previewNodeId}`,
            source: nodeId,
            target: previewNodeId,
            animated: true,
          };
          setEdges((eds) => eds.concat(newEdge));
          message.success('🎬 视频生成成功！');
          console.log(`✅ 视频 URL: ${videoUrl}`);
          return;
        } else {
          console.warn('⚠️ 状态为 completed 但 videoUrl 为空');
          message.warning('视频生成完成，但未获取到视频链接');
          return;
        }
      }

      if (data.status === 'processing' || data.status === 'queued' || data.status === 'in_progress') {
        if (attempts < maxAttempts) {
          console.log(`⏳ 视频生成中 (${data.progress || 0}%)，5秒后继续...`);
          setTimeout(poll, 5000);
        } else {
          message.error('生成超时，请稍后刷新查看');
        }
        return;
      }

      if (data.status === 'failed') {
        const errorMsg = data.error || '视频生成失败';
        console.error(`❌ 生成失败: ${errorMsg}`);
        message.error(errorMsg);
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, status: 'failed' } } : node
          )
        );
        return;
      }

      if (attempts < maxAttempts) {
        console.log(`⏳ 未知状态 (${data.status})，继续轮询...`);
        setTimeout(poll, 5000);
      } else {
        message.error('生成超时');
      }

    } catch (error: any) {
      console.error('❌ 轮询错误:', error);
      message.error(error.message || '轮询失败');
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, status: 'failed' } } : node
        )
      );
    }
  };

  await poll();
};

// ============================================================
// pollGrokResult（Grok 轮询）
// ============================================================
const pollGrokResult = async (generationId: string, nodeId: string, targetPos: { x: number; y: number }) => {
  let attempts = 0;
  const maxAttempts = 60;

  const poll = async () => {
    attempts++;
    console.log(`🔵 Grok 轮询第 ${attempts} 次，generationId: ${generationId}`);

    try {
      const res = await fetch(`/api/video/grok/status?generationId=${generationId}`);
      const data = await res.json();

      console.log(`📥 Grok 轮询响应 (第 ${attempts} 次):`, JSON.stringify(data, null, 2));

      if (data.status === 'done' || data.status === 'completed' || data.status === 'succeeded') {
        const videoUrl = data.videoUrl || data.video?.url || null;
        if (videoUrl) {
          if (data.credits !== undefined) {
            setCredits(data.credits);
          }
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, status: 'completed', videoUrl: videoUrl } }
                : node
            )
          );
          const previewNodeId = `preview-${Date.now()}`;
          const previewNode: Node = {
            id: previewNodeId,
            type: 'videoPreview',
            position: { x: targetPos.x + 200, y: targetPos.y + 50 },
            data: { videoUrl: videoUrl },
          };
          setNodes((nds) => nds.concat(previewNode));
          const newEdge: Edge = {
            id: `edge-${nodeId}-${previewNodeId}`,
            source: nodeId,
            target: previewNodeId,
            animated: true,
          };
          setEdges((eds) => eds.concat(newEdge));
          message.success('🎬 Grok 视频生成成功！');
          console.log(`✅ Grok 视频 URL: ${videoUrl}`);
          return;
        } else {
          console.warn('⚠️ Grok 状态为 done 但 videoUrl 为空');
          message.warning('视频生成完成，但未获取到视频链接');
          return;
        }
      }

      if (data.status === 'processing' || data.status === 'queued' || data.status === 'in_progress') {
        if (attempts < maxAttempts) {
          console.log(`⏳ Grok 视频生成中 (${data.progress || 0}%)，5秒后继续...`);
          setTimeout(poll, 5000);
        } else {
          message.error('Grok 生成超时，请稍后刷新查看');
        }
        return;
      }

      if (data.status === 'failed' || data.status === 'expired') {
        const errorMsg = data.error || 'Grok 视频生成失败';
        console.error(`❌ Grok 生成失败: ${errorMsg}`);
        message.error(errorMsg);
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, status: 'failed' } } : node
          )
        );
        return;
      }

      if (attempts < maxAttempts) {
        console.log(`⏳ Grok 未知状态 (${data.status})，继续轮询...`);
        setTimeout(poll, 5000);
      } else {
        message.error('Grok 生成超时');
      }

    } catch (error: any) {
      console.error('❌ Grok 轮询错误:', error);
      message.error(error.message || '轮询失败');
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, status: 'failed' } } : node
        )
      );
    }
  };

  await poll();
};

  const onDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div style={{ 
        padding: '12px 24px', 
        background: '#fff', 
        borderBottom: '1px solid #e8e8e8', 
        display: 'flex', 
        flexWrap: 'wrap',
        alignItems: 'center', 
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>🎬 无限画布</Title>
          <Divider type="vertical" />
          <Button size="small" icon={<FormOutlined />} onClick={() => addNode('textInput')}>文本</Button>
          <Button size="small" icon={<FileImageOutlined />} onClick={() => addNode('imageInput')}>图片</Button>
          <Button size="small" icon={<VideoCameraOutlined />} onClick={() => addNode('videoGen')}>视频</Button>
          <Button size="small" icon={<EyeOutlined />} onClick={() => addNode('videoPreview')}>预览</Button>
        </div>

        <Divider type="vertical" style={{ height: 28 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: 13, color: '#666' }}><SettingOutlined /> 配置：</Text>
          
          <Select
            value={selectedModel}
            onChange={handleModelChange}
            style={{ width: 180 }}
            placeholder="选择模型"
          >
            {availableModels.map(model => (
              <Option key={model.value} value={model.value}>
                {model.label}
                {model.maxDuration && <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>≤{model.maxDuration}s</Tag>}
              </Option>
            ))}
          </Select>

          <Select
            value={selectedDuration}
            onChange={handleDurationChange}
            style={{ width: 90 }}
            placeholder="时长"
          >
            {availableDurations.map(d => (
              <Option key={d} value={d}>{d}s</Option>
            ))}
          </Select>

          <Select
            value={selectedAspectRatio}
            onChange={setSelectedAspectRatio}
            style={{ width: 130 }}
            placeholder="比例"
          >
            {ASPECT_RATIO_OPTIONS.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label.split(' ')[0]}
              </Option>
            ))}
          </Select>

          <Select
            value={selectedResolution}
            onChange={setSelectedResolution}
            style={{ width: 100 }}
            placeholder="分辨率"
          >
            {availableResolutions.map(res => (
              <Option key={res} value={res}>{res}</Option>
            ))}
          </Select>

          {/* 积分显示 */}
          <Tag color="gold" style={{ fontSize: 13, fontWeight: 600 }}>
            💰 {requiredCredits} 积分
          </Tag>
        </div>

        <Divider type="vertical" style={{ height: 28 }} />

        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />} 
          onClick={executeWorkflow} 
          loading={processing}
          size="middle"
        >
          执行工作流
        </Button>
      </div>

      {/* 画布区域 */}
      <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="bottom-center">
            <Text type="secondary">💡 点击节点编辑属性 | 从右侧把手拖拽连线到目标节点左侧 | 顶部配置全局参数</Text>
          </Panel>
        </ReactFlow>
      </div>

      {/* 节点属性抽屉 */}
      <Drawer
        title="节点属性"
        open={drawerOpen}
        onClose={onDrawerClose}
        width={420}
        extra={
          <Space>
            {selectedNode && selectedNode.type !== 'videoPreview' && (
              <Button danger icon={<DeleteOutlined />} onClick={onDeleteNode}>删除</Button>
            )}
            <Button onClick={onDrawerClose}>取消</Button>
            <Button type="primary" onClick={onSaveNode}>保存</Button>
          </Space>
        }
      >
        {selectedNode && (
          <Form form={form} layout="vertical" initialValues={selectedNode.data}>
            {selectedNode.type === 'textInput' && (
              <Form.Item name="prompt" label="提示词" rules={[{ required: true, message: '请输入提示词' }]}>
                <Input.TextArea rows={4} placeholder="请输入视频描述，如：一只猫在花园里奔跑，阳光明媚，高清" />
              </Form.Item>
            )}
            {selectedNode.type === 'imageInput' && (
              <>
                <Form.Item name="prompt" label="图片描述（用于视频生成）">
                  <Input.TextArea 
                    rows={3} 
                    placeholder="请输入这张图片的描述，如：一只猫在花园里奔跑，阳光明媚，高清" 
                  />
                </Form.Item>
                <Form.Item name="imageUrl" label="图片URL">
                  <Input placeholder="输入图片URL（或上传图片自动获取）" />
                </Form.Item>
                <Form.Item label="上传图片">
                  <Upload
                    accept="image/*"
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                  >
                    <Button loading={uploading}>上传图片</Button>
                  </Upload>
                </Form.Item>
              </>
            )}
            {selectedNode.type === 'videoGen' && (
              <>
                <Form.Item name="model" label="模型">
                  <Select 
                    placeholder="选择模型"
                    onChange={(value) => {
                      const durations = getDurationsByModel(value);
                      if (durations.length > 0) {
                        const currentDuration = form.getFieldValue('duration');
                        if (!currentDuration || !durations.includes(currentDuration)) {
                          form.setFieldsValue({ duration: durations[0] });
                        }
                      }
                      const resolutions = getResolutionsByModel(value);
                      if (resolutions.length > 0 && !resolutions.includes(form.getFieldValue('resolution'))) {
                        form.setFieldsValue({ resolution: resolutions[0] });
                      }
                    }}
                  >
                    {availableModels.map(model => (
                      <Option key={model.value} value={model.value}>{model.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="duration" label="时长 (秒)">
                  <Select>
                    {availableDurations.map(d => (
                      <Option key={d} value={d}>{d} 秒</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="aspectRatio" label="宽高比">
                  <Select>
                    {ASPECT_RATIO_OPTIONS.map(opt => (
                      <Option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="resolution" label="分辨率">
                  <Select>
                    {availableResolutions.map(res => (
                      <Option key={res} value={res}>{res}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </>
            )}
            {selectedNode.type === 'videoPreview' && (
              <>
                <Form.Item name="videoUrl" label="视频URL">
                  <Input placeholder="输入视频URL" />
                </Form.Item>
                {selectedNode.data.videoUrl && (
                  <video controls style={{ width: '100%', maxHeight: 300 }} src={selectedNode.data.videoUrl} />
                )}
              </>
            )}
          </Form>
        )}
      </Drawer>
    </div>
  );
}