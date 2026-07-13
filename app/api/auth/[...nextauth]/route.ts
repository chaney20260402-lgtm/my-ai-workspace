// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type DefaultSession, type Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getRedis } from '@/lib/redis';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

// ========== 扩展类型定义 ==========
declare module "next-auth" {
  interface Session {
    user: {
      phone?: string;
      id?: string;
      membershipType?: string;
    } & DefaultSession["user"];
  }
  interface User {
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    phone?: string;
    id?: string;
  }
}

// ========== 辅助函数：生成6位邀请码 ==========
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateUniqueInviteCode = async (): Promise<string> => {
  let code = generateInviteCode();
  while (await prisma.user.findUnique({ where: { myInviteCode: code } })) {
    code = generateInviteCode();
  }
  return code;
};

export const authOptions = {
  // ---------- 会话配置 ----------
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60,
  },

  // ---------- 页面配置 ----------
  pages: {
    signIn: "/workspace",
    error: "/workspace",
  },

  providers: [
    // ---------- Google 登录 ----------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ---------- 手机号 + 验证码 + 密码登录 ----------
    CredentialsProvider({
      id: "credentials",
      name: "phone",
      credentials: {
        phone: { label: "手机号", type: "text" },
        code: { label: "验证码", type: "text" },
        password: { label: "密码", type: "password" },
        inviteCode: { label: "邀请码", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone) {
          return null;
        }

        const phone = credentials.phone.trim();
        const inviteCode = credentials.inviteCode?.trim();

        // ============================================================
        // 1. 验证用户身份（手机号 + 验证码 或 密码）
        // ============================================================
        let isVerified = false;

        // ----- 分支一：密码登录 -----
        if (credentials.password) {
          const password = credentials.password.trim();
          if (!password) throw new Error("请输入密码");

          const redis = getRedis();
          const storedUser = await redis.get(`user:${phone}`);
          if (!storedUser) throw new Error("用户不存在，请先注册");

          const userData = JSON.parse(storedUser);
          const isValid = await bcrypt.compare(password, userData.password);
          if (!isValid) throw new Error("密码错误，请重新输入");
          isVerified = true;
        }

        // ----- 分支二：验证码登录 -----
        else if (credentials.code) {
          const code = credentials.code.trim();

          // 万能验证码（测试用）
          if (code === "000000") {
            isVerified = true;
          } else {
            const redis = getRedis();
            const key = `sms:${phone}`;
            const storedCode = await redis.get(key);
            console.log(`📥 从 Redis 读取: key=${key}, value=${storedCode}`);

            if (!storedCode) throw new Error("请先获取验证码");
            if (storedCode !== code) throw new Error("验证码错误，请重新输入");
            await redis.del(key);
            isVerified = true;
          }
        }

        if (!isVerified) {
          throw new Error("请提供验证码或密码进行登录");
        }

        // ============================================================
        // 2. 验证通过后，在 PostgreSQL 中查找或创建用户
        // ============================================================
        let user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) {
          // ----- 处理邀请码（新用户）-----
          let invitedBy: string | null = null;
          if (inviteCode) {
            const inviter = await prisma.user.findUnique({
              where: { myInviteCode: inviteCode },
            });
            if (inviter) {
              invitedBy = inviter.phone;
            }
          }

          // ----- 生成自己的邀请码 -----
          const myCode = await generateUniqueInviteCode();

          // ----- 创建用户 -----
          user = await prisma.user.create({
            data: {
              phone,
              credits: 0,
              membershipType: 'experience',
              myInviteCode: myCode,
              invitedBy: invitedBy,
            },
          });
          console.log(`✅ 新用户注册: ${phone}，邀请码: ${myCode}${invitedBy ? `，邀请人: ${invitedBy}` : ''}`);
        } else {
          // ✅ 老用户：如果没有邀请码，自动生成
          if (!user.myInviteCode) {
            const newCode = await generateUniqueInviteCode();
            user = await prisma.user.update({
              where: { phone },
              data: { myInviteCode: newCode },
            });
            console.log(`✅ 为老用户 ${phone} 生成邀请码: ${newCode}`);
          }
        }

        // ============================================================
        // 3. 返回用户对象（NextAuth 会存入 JWT）
        // ============================================================
        return {
          id: user.phone,
          phone: user.phone,
          name: user.phone,
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",

  callbacks: {
    // JWT 回调
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        token.phone = user.phone;
        token.id = user.id;
      }
      return token;
    },

    // Session 回调 - 添加 membershipType
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.phone = token.phone as string || undefined;
        session.user.id = token.id as string || undefined;

        // 从数据库获取 membershipType
        if (token.phone) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { phone: token.phone as string },
              select: { membershipType: true },
            });
            if (dbUser) {
              session.user.membershipType = dbUser.membershipType;
            }
          } catch (error) {
            console.error('获取会员类型失败:', error);
          }
        }
      }
      return session;
    },

    // 登录成功回调
    async signIn({ user }: { user: any }) {
      console.log(`🔐 用户登录: ${user?.phone || user?.email || user?.name}`);
      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };