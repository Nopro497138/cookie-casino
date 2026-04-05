import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import { config } from "./config";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email" } },
      profile(profile) {
        const avatar = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${profile.avatar.startsWith("a_") ? "gif" : "webp"}`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator ?? "0") % 5}.png`;
        return { id: profile.id, discordId: profile.id, name: profile.username, email: profile.email, image: avatar };
      },
    }),
  ],
  session: { strategy: "database", maxAge: 365 * 24 * 60 * 60 },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const db = await prisma.user.findUnique({
          where: { id: user.id },
          select: { discordId: true, balance: true, isBanned: true, banReason: true },
        });
        if (db) Object.assign(session.user, db);
      }
      return session;
    },
    async signIn({ profile }) {
      const p = profile as { id?: string };
      if (!p?.id) return false;
      const existing = await prisma.user.findFirst({ where: { discordId: p.id } });
      if (existing?.isBanned) return `/login?error=banned&reason=${encodeURIComponent(existing.banReason ?? "Banned")}`;
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      const u = user as unknown as Record<string, unknown>;
      await prisma.user.update({ where: { id: user.id }, data: { balance: config.startingBalance, discordId: (u.discordId as string) ?? user.id } });
      await prisma.transaction.create({ data: { userId: user.id, amount: config.startingBalance, balanceAfter: config.startingBalance, type: "welcome_bonus", description: "Welcome bonus!" } });
    },
  },
  pages: { signIn: "/login", error: "/login" },
};

declare module "next-auth" {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null; discordId?: string; balance?: number; isBanned?: boolean; banReason?: string };
  }
}
