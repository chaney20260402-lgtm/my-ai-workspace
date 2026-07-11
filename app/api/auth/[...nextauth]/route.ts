// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type DefaultSession, type Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getRedis } from '@/lib/redis';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma'; // 确保顶部已导入 prisma

// ========== 扩展类型定义 ==========
declare module "next-auth" {
  interface Session {
    user: {
      phone?: string;
      id?: string;
      membershipType?: string; // ✅ 新增
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

    // ---------- 手机号 + 验证码 + 密码登录 ----------
    CredentialsProvider({
      id: "credentials",
      name: "phone",
      credentials: {
        phone: { label: "手机号", type: "text" },
        code: { label: "验证码", type: "text" },
        password: { label: "密码", type: "password" }, // ✅ 新增密码字段
        inviteCode: { label: "邀请码", type: "text" }, // ✅ 新增邀请码字段（选填）
      },
      async authorize(credentials) {
        // 参数校验
        if (!credentials?.phone) {
          return null;
        }

        const phone = credentials.phone.trim();
        const inviteCode = credentials.inviteCode?.trim(); // 可能为 undefined
        // ============================================================
        // 1. 验证用户身份（手机号 + 验证码 或 密码）
        // ============================================================
        let isVerified = false;
        let userData: any = null;

        // ----- 分支一：密码登录（如果提供了 password 字段） -----
        if (credentials.password) {
          const password = credentials.password.trim();
          if (!password) {
            throw new Error("请输入密码");
          }

          const redis = getRedis();
          const userData = await redis.get(`user:${phone}`);
          if (!userData) {
            throw new Error("用户不存在，请先注册");
          }

          const user = JSON.parse(userData);
          // 使用顶部导入的 bcrypt
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            throw new Error("密码错误，请重新输入");
          }

          return {
            id: phone,
            name: user.name || phone,
            phone: phone,
          };
        }

        // ----- 分支二：验证码登录（如果提供了 code 字段） -----
        if (credentials.code) {
          const code = credentials.code.trim();

          // 万能验证码（测试用）
          if (code === "000000") {
            return {
              id: phone,
              name: phone,
              phone: phone,
            };
          }

          const redis = getRedis();
          const key = `sms:${phone}`;
          const storedCode = await redis.get(key);
          console.log(`📥 从 Redis 读取: key=${key}, value=${storedCode}`);

          if (!storedCode) {
            throw new Error("请先获取验证码");
          }
          if (storedCode !== code) {
            console.log(`❌ 验证码不匹配: 输入=${code}, 存储=${storedCode}`);
            throw new Error("验证码错误，请重新输入");
          }
          await redis.del(key);
          isVerified = true;
          return {
            id: phone,
            name: phone,
            phone: phone,
          };
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
          // ----- 处理邀请码（如果提供了）-----
          let invitedBy: string | null = null;
          if (inviteCode) {
            const inviter = await prisma.user.findUnique({
              where: { myInviteCode: inviteCode },
            });
            if (inviter) {
              invitedBy = inviter.phone;
            }
          }

          // ----- 生成自己的邀请码（6位字母数字）-----
          const generateInviteCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = '';
            for (let i = 0; i < 6; i++) {
              code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
          };
          let myCode = generateInviteCode();
          // 确保唯一
          while (await prisma.user.findUnique({ where: { myInviteCode: myCode } })) {
            myCode = generateInviteCode();
          }

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

     // ✅ Session 回调 - 添加 membershipType
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.phone = token.phone as string || undefined;
        session.user.id = token.id as string || undefined;
        
        // ✅ 从数据库获取 membershipType
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