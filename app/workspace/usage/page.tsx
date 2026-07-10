// app/workspace/usage/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import UsageClient from './UsageClient';

const ADMIN_PHONE = '13929767725'; // 🔥 替换成你的手机号

export default async function UsagePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.phone !== ADMIN_PHONE) {
    redirect('/workspace');
  }
  return <UsageClient />;
}