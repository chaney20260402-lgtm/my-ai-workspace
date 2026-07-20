const nextConfig = {
  eslint: {
    // 构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 构建时忽略 TypeScript 类型错误
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  },
};

export default nextConfig;