'use client';

import React, { useEffect, useRef } from 'react';
// @ts-ignore
import { fabric } from 'fabric';

export default function CanvasArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 500,
      backgroundColor: '#fff',
    });

    const text = new fabric.Textbox('Hello Fabric', {
      left: 100,
      top: 100,
      fontSize: 20,
    });

    canvas.add(text);

    return () => canvas.dispose();
  }, []);

  return <canvas ref={canvasRef} />;
}