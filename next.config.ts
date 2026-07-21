import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 其他配置（如果有）
  
  // ✅ 将服务端环境变量暴露给客户端
  env: {
    NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  },
};

export default nextConfig;