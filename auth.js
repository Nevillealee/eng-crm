import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "./lib/prisma";
import { extractRequestIp } from "./lib/request-ip";

const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

async function getUserRoleSnapshot(userId) {
  if (!userId || typeof userId !== "string") {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || process.env.SUPABASE_JWT_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember me", type: "checkbox" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email?.toLowerCase();
        const password = credentials?.password;
        const rememberMe = credentials?.rememberMe === "true";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return null;
        }

        if (!user.emailVerified) {
          return null;
        }

        const lastLoginIp = extractRequestIp(request);

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date(), lastLoginIp },
        });

        return {
          id: user.id,
          email: user.email,
          isAdmin: Boolean(user.isAdmin),
          role: user.isAdmin ? "admin" : "engineer",
          rememberMe,
          name:
            user.name ||
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
            user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rememberMe = Boolean(user.rememberMe);
      }

      if (typeof token.rememberMe !== "boolean") {
        token.rememberMe = false;
      }

      const roleSnapshot = await getUserRoleSnapshot(token?.id);
      if (!roleSnapshot) {
        delete token.id;
        token.isAdmin = false;
        token.role = "engineer";
        return token;
      }

      token.isAdmin = Boolean(roleSnapshot?.isAdmin);
      token.role = token.isAdmin ? "admin" : "engineer";

      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (user || typeof token.exp !== "number") {
        token.exp =
          nowInSeconds +
          (token.rememberMe ? REMEMBER_ME_MAX_AGE_SECONDS : DEFAULT_SESSION_MAX_AGE_SECONDS);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.role = token.role;
        session.user.rememberMe = Boolean(token.rememberMe);
      }
      return session;
    },
  },
});
