import NextAuth, { type DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { codeStore } from '@/lib/store';

declare module "next-auth" {
  interface Session {
    user: {
      phone?: string
    } & DefaultSession["user"]
  }
  interface User {
    phone?: string
  }
}

const handler = NextAuth({
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
  if (!credentials?.phone || !credentials?.code) return null;
  const record = codeStore[credentials.phone];
  if (!record) throw new Error("请先获取验证码");
  if (Date.now() > record.expires) throw new Error("验证码已过期");
  if (record.code !== credentials.code) throw new Error("验证码错误");
  return { id: credentials.phone, name: "手机用户", phone: credentials.phone };
},
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  callbacks: {
    async session({ session, token }) {
      if (token.phone && session.user) {
        session.user.phone = token.phone as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.phone = user.phone;
      }
      return token;
    },
  },
})

export { handler as GET, handler as POST }
