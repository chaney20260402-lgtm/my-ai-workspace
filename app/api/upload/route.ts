// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || `${Date.now()}.png`;

    // 从请求中获取 Blob 数据
    const blobData = await request.blob();

    // 上传到 Vercel Blob
    const blob = await put(filename, blobData, {
      access: 'private',
    });

    console.log('✅ 上传成功:', blob.url);

    return NextResponse.json({ 
      success: true, 
      url: blob.url 
    });
  } catch (error: any) {
    console.error('❌ 上传失败:', error);
    return NextResponse.json({ 
      error: error.message || '上传失败' 
    }, { status: 500 });
  }
}