import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Support demo/local credentials login so local hosting works without Google OAuth setup
providers.push(
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null;
      const email = String(credentials.email).toLowerCase().trim();
      let user = await db.user.findUnique({ where: { email } });
      if (!user) {
        user = await db.user.create({
          data: {
            email,
            name: email.split("@")[0].replace(/[._-]/g, " "),
            role: email.includes("admin") ? "ADMIN" : "USER",
            isApproved: true,
          },
        });
      }
      return user;
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // On first sign-in, fetch role and approval status from DB
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, isApproved: true },
        });
        token.role = dbUser?.role ?? "USER";
        token.isApproved = dbUser?.isApproved ?? true;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as UserRole;
        session.user.isApproved = token.isApproved as boolean;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return false;
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
