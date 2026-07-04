// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type DefaultSession, type Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getRedis } from '@/lib/redis';

// ========== 扩展类型定义 ==========
declare module "next-auth" {
  interface Session {
    user: {
      phone?: string;
      id?: string;
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

    // ---------- 手机号 + 验证码登录 ----------
    CredentialsProvider({
      id: "credentials",
      name: "phone",
      credentials: {
        phone: { label: "手机号", type: "text" },
        code: { label: "验证码", type: "text" },
      },
      async authorize(credentials) {
        // 参数校验
        if (!credentials?.phone || !credentials?.code) {
          return null;
        }

        const phone = credentials.phone.trim();
        const code = credentials.code.trim();

        // 万能验证码（测试用）
        if (code === "000000") {
          return {
            id: phone,
            name: phone,
            phone: phone,
          };
        }

        // 生产环境验证
        try {
          const redis = getRedis();
          const storedCode = await redis.get(`sms:${phone}`);
          console.log(`📦 Redis 中存储的验证码: ${storedCode}`);

          if (!storedCode) {
            throw new Error("请先获取验证码");
          }
          if (storedCode !== code) {
            throw new Error("验证码错误，请重新输入");
          }
          await redis.del(`sms:${phone}`);

          return {
            id: phone,
            name: phone,
            phone: phone,
          };
        } catch (error: any) {
          throw new Error(error.message || "登录失败，请重试");
        }
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

    // Session 回调
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.phone = token.phone as string || undefined;
        session.user.id = token.id as string || undefined;
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