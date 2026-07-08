'use client';

import React, { useEffect, useRef } from 'react';

const STICKER_COLORS = {
  right: '#464444',
  left: '#303131',
  up: '#f7f7f7',
  down: '#ffffff',
  front: '#2c2b2b',
  back: '#292727',
};

export default function PremiumCube() {
  const containerRef = useRef<HTMLDivElement>(null);
  // 三层容器的引用（按Y轴分层：上层、中层、下层）
  const layerRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    let time = 0;

    // ===== 分层旋转状态 =====
    // 每层累计角度（绕Y轴）
    const layerAngles = [0, 0, 0];
    // 每层当前正在旋转的目标增量（+90 或 -90）
    const layerTargets = [0, 0, 0];
    // 当前正在旋转的层索引 (0:上层, 1:中层, 2:下层)
    let currentLayer = 0;
    // 旋转进度 0~1
    let progress = 0;
    // 阶段: 'rotating' 旋转中, 'pausing' 暂停中
    let phase: 'rotating' | 'pausing' = 'rotating';
    let phaseTimer = 0;

    // 参数（可调整）
    const ROTATE_DURATION = 0.6;   // 每层旋转持续时间（秒）
    const PAUSE_DURATION = 0.25;   // 旋转后暂停时间（秒）

    // 初始化：让第一层开始旋转（上层）
    layerTargets[0] = 90; // 上层先转 +90°

    const animate = () => {
      time += 0.01;

      // ===== 1. 整体自转（保持不变） =====
      const rotY = time * 2;                     // 原有速度
      const rotX = Math.sin(time * 0.65) * 10 + 25; // 原有摆动
      if (container) {
        container.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }

      // ===== 2. 分层旋转逻辑 =====
      if (phase === 'rotating') {
        // 旋转中：增加进度
        progress += (1 / ROTATE_DURATION) * 0.01;
        if (progress >= 1) {
          progress = 1;
          // 完成一次旋转：将目标增量加到累计角度
          layerAngles[currentLayer] += layerTargets[currentLayer];
          // 清空该层目标（不再变化）
          layerTargets[currentLayer] = 0;
          // 进入暂停
          phase = 'pausing';
          phaseTimer = 0;
        }
      } else if (phase === 'pausing') {
        phaseTimer += 0.01;
        if (phaseTimer >= PAUSE_DURATION) {
          // 切换到下一层
          currentLayer = (currentLayer + 1) % 3;
          progress = 0;
          phase = 'rotating';
          // 为新层设置目标增量（方向交替）
          // 每次旋转方向交替，实现“来回拧”效果
          if (currentLayer === 0) layerTargets[0] = 90;
          else if (currentLayer === 1) layerTargets[1] = -90;
          else if (currentLayer === 2) layerTargets[2] = 90;
        }
      }

      // ===== 3. 计算每层当前显示角度 =====
      // 当前正在旋转的层：基础角度 + 进度 * 目标增量
      const displayAngles = [
        currentLayer === 0 ? layerAngles[0] + layerTargets[0] * progress : layerAngles[0],
        currentLayer === 1 ? layerAngles[1] + layerTargets[1] * progress : layerAngles[1],
        currentLayer === 2 ? layerAngles[2] + layerTargets[2] * progress : layerAngles[2],
      ];

      // ===== 4. 应用到三层容器 =====
      layerRefs.current.forEach((layerEl, index) => {
        if (layerEl) {
          layerEl.style.transform = `rotateY(${displayAngles[index]}deg)`;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  // ===== 生成单个小块的6个面（完全不变） =====
  const createFaces = (x: number, y: number, z: number): React.ReactNode[] => {
    const faces: React.ReactNode[] = [];
    const half = 65;
    const gap = 1;

    const faceStyle = {
      position: 'absolute' as const,
      width: 130 - gap * 2,
      height: 130 - gap * 2,
      borderRadius: '2px',
      border: '1px solid rgba(0,0,0,0.3)',
      backfaceVisibility: 'visible' as const,
    };

    // 前面
    const isFront = z === 1;
    faces.push(
      <div
        key="front"
        style={{
          ...faceStyle,
          background: isFront
            ? `radial-gradient(circle at 35% 35%, ${STICKER_COLORS.front}dd, ${STICKER_COLORS.front})`
            : 'radial-gradient(circle at 40% 40%, #3a3a3a, #1a1a1a)',
          boxShadow: isFront
            ? 'inset 0 2px 8px rgba(255,255,255,0.2), inset 0 -2px 8px rgba(0,0,0,0.4)'
            : 'inset 0 1px 4px rgba(255,255,255,0.05), inset 0 -1px 4px rgba(0,0,0,0.5)',
          transform: `translateZ(${half}px)`,
        }}
      />
    );

    // 后面
    const isBack = z === -1;
    faces.push(
      <div
        key="back"
        style={{
          ...faceStyle,
          background: isBack
            ? `radial-gradient(circle at 35% 35%, ${STICKER_COLORS.back}dd, ${STICKER_COLORS.back})`
            : 'radial-gradient(circle at 40% 40%, #3a3a3a, #1a1a1a)',
          boxShadow: isBack
            ? 'inset 0 2px 8px rgba(255,255,255,0.2), inset 0 -2px 8px rgba(0,0,0,0.4)'
            : 'inset 0 1px 4px rgba(255,255,255,0.05), inset 0 -1px 4px rgba(0,0,0,0.5)',
          transform: `rotateY(180deg) translateZ(${half}px)`,
        }}
      />
    );

    // 右面
    const isRight = x === 1;
    faces.push(
      <div
        key="right"
        style={{
          ...faceStyle,
          background: isRight
            ? `radial-gradient(circle at 35% 35%, ${STICKER_COLORS.right}dd, ${STICKER_COLORS.right})`
            : 'radial-gradient(circle at 40% 40%, #3a3a3a, #1a1a1a)',
          boxShadow: isRight
            ? 'inset 0 2px 8px rgba(255,255,255,0.2), inset 0 -2px 8px rgba(0,0,0,0.4)'
            : 'inset 0 1px 4px rgba(255,255,255,0.05), inset 0 -1px 4px rgba(0,0,0,0.5)',
          transform: `rotateY(90deg) translateZ(${half}px)`,
        }}
      />
    );

    // 左面
    const isLeft = x === -1;
    faces.push(
      <div
        key="left"
        style={{
          ...faceStyle,
          background: isLeft
            ? `radial-gradient(circle at 35% 35%, ${STICKER_COLORS.left}dd, ${STICKER_COLORS.left})`
            : 'radial-gradient(circle at 40% 40%, #3a3a3a, #1a1a1a)',
          boxShadow: isLeft
            ? 'inset 0 2px 8px rgba(255,255,255,0.2), inset 0 -2px 8px rgba(0,0,0,0.4)'
            : 'inset 0 1px 4px rgba(255,255,255,0.05), inset 0 -1px 4px rgba(0,0,0,0.5)',
          transform: `rotateY(-90deg) translateZ(${half}px)`,
        }}
      />
    );

    // 上面
    const isUp = y === 1;
    faces.push(
      <div
        key="up"
        style={{
          ...faceStyle,
          background: isUp
            ? `radial-gradient(circle at 35% 35%, ${STICKER_COLORS.up}dd, ${STICKER_COLORS.up})`
            : 'radial-gradient(circle at 40% 40%, #3a3a3a, #1a1a1a)',
          boxShadow: isUp
            ? 'inset 0 2px 8px rgba(255,255,255,0.2), inset 0 -2px 8px rgba(0,0,0,0.4)'
            : 'inset 0 1px 4px rgba(255,255,255,0.05), inset 0 -1px 4px rgba(0,0,0,0.5)',
          transform: `rotateX(90deg) translateZ(${half}px)`,
        }}
      />
    );

    // 下面
    const isDown = y === -1;
    faces.push(
      <div
        key="down"
        style={{
          ...faceStyle,
          background: isDown
            ? `radial-gradient(circle at 35% 35%, ${STICKER_COLORS.down}dd, ${STICKER_COLORS.down})`
            : 'radial-gradient(circle at 40% 40%, #3a3a3a, #1a1a1a)',
          boxShadow: isDown
            ? 'inset 0 2px 8px rgba(255,255,255,0.2), inset 0 -2px 8px rgba(0,0,0,0.4)'
            : 'inset 0 1px 4px rgba(255,255,255,0.05), inset 0 -1px 4px rgba(0,0,0,0.5)',
          transform: `rotateX(-90deg) translateZ(${half}px)`,
        }}
      />
    );

    return faces;
  };

  // ===== 生成所有小块（按层分组） =====
  const generateLayers = () => {
    const cubeSize = 140;
    const gap = 1.5;

    // 三层容器：0=上层(y=1), 1=中层(y=0), 2=下层(y=-1)
    const layers: React.ReactNode[][] = [[], [], []];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const faces = createFaces(x, y, z);
          const layerIndex = y + 1; // -1→0, 0→1, 1→2

          const cubelet = (
            <div
              key={`${x},${y},${z}`}
              style={{
                position: 'absolute',
                width: cubeSize - gap * 2,
                height: cubeSize - gap * 2,
                transform: `translate3d(${x * cubeSize}px, ${y * cubeSize}px, ${z * cubeSize}px)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {faces}
            </div>
          );

          layers[layerIndex].push(cubelet);
        }
      }
    }

    return layers;
  };

  const layers = generateLayers();

  // ===== 渲染 =====
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1200,   // 保持不变
        position: 'relative',
      }}
    >
      {/* 环境光晕（保持不变） */}
      <div
        style={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          background: 'radial-gradient(circle at center, rgba(22,119,255,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* 魔方整体容器 - 只做整体旋转（尺寸和角度不变） */}
      <div
        ref={containerRef}
        style={{
          width: 120,
          height: 120,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(50deg) rotateY(50deg)',   // 保持用户的初始角度
        }}
      >
        {/* 三层独立容器（每个包含对应的小块） */}
        {layers.map((layerCubelets, index) => (
          <div
            key={index}
            ref={(el) => { layerRefs.current[index] = el; }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
              transform: 'rotateY(0deg)',   // 初始无旋转，由JS控制
            }}
          >
            {layerCubelets}
          </div>
        ))}
      </div>

      {/* 底部反射（保持不变） */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          width: '60%',
          height: '20%',
          background: 'radial-gradient(ellipse at center, rgba(22,119,255,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(10px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
