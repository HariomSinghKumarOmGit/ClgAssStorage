import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
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
        token.role = dbUser?.role ?? "USER"; // Default role is USER
        token.isApproved = dbUser?.isApproved ?? false;
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
      // Allow all Google sign-ins — access approval is a separate layer
      // This just verifies the Google identity
      if (!user.email) return false;
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
