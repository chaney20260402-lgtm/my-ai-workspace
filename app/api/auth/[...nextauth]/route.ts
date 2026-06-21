import NextAuth, { type DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

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
        if (!credentials) throw new Error("缺少凭证");
        const { phone, code } = credentials as { phone: string; code: string };
        const FIXED_CODE = "123456";
        if (code !== FIXED_CODE) {
          throw new Error("验证码错误（测试验证码为 123456）");
        }
        return { id: "1", name: "手机用户", phone };
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
