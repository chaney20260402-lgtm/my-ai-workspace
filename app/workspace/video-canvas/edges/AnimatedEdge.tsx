import React from 'react';
import { getBezierPath, EdgeProps } from 'reactflow';

const AnimatedEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <defs>
        <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#52c41a" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#1890ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#52c41a" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="flow-gradient-moving" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#52c41a" stopOpacity="0" />
          <stop offset="30%" stopColor="#1890ff" stopOpacity="1" />
          <stop offset="70%" stopColor="#1890ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#52c41a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        id="edge-path"
        d={edgePath}
        className="react-flow__edge-path"
        stroke="url(#flow-gradient-moving)"
        strokeWidth={3}
        fill="none"
        markerEnd={markerEnd}
      />
      <path
        d={edgePath}
        stroke="rgba(24,144,255,0.3)"
        strokeWidth={6}
        fill="none"
        className="edge-pulse"
      />
      <style>{`
        @keyframes pulse-flow {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        .edge-pulse {
          stroke-dasharray: 5 15;
          animation: pulse-flow 0.8s linear infinite;
        }
      `}</style>
    </>
  );
};

export default AnimatedEdge;