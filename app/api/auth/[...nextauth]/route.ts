// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type DefaultSession, type Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { redis } from '@/lib/redis';

declare module "next-auth" {
  interface Session {
    user: {
      phone?: string;
    } & DefaultSession["user"];
  }
  interface User {
    phone?: string;
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "phone",
      credentials: {
        phone: { label: "手机号", type: "text" },
        code: { label: "验证码", type: "text" },
      },
      async authorize(credentials) {
        // 万能验证码（测试）
        if (credentials?.code === "000000") {
          return {
            id: credentials.phone || "13800138000",
            name: "测试用户",
            phone: credentials.phone || "13800138000",
          };
        }
        if (!credentials?.phone || !credentials?.code) return null;
        const storedCode = await redis.get(`sms:${credentials.phone}`);
        if (!storedCode) throw new Error("请先获取验证码");
        if (storedCode !== credentials.code) throw new Error("验证码错误");
        await redis.del(`sms:${credentials.phone}`);
        return { id: credentials.phone, name: "手机用户", phone: credentials.phone };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.phone && session.user) {
        session.user.phone = token.phone as string;
      }
      return session;
    },
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        token.phone = user.phone;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
