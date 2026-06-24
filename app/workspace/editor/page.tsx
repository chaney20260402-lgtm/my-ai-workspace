'use client';

import CanvasArea from '../components/CanvasArea';

export default function EditorPage() {

  return (
    <div
      style={{
        width:'100%',
        height:'100vh',
        position:'relative'
      }}
    >
      <CanvasArea />
    </div>
  );
}