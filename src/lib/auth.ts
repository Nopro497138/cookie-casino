import { NextAuthOptions } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import { config } from "./config";

const baseAdapter = PrismaAdapter(prisma);

const adapter: Adapter = {
  ...baseAdapter,
  async createUser(data: Omit<AdapterUser, "id"> & { discordId?: string }) {
    const discordId = data.discordId;

    if (!discordId) {
      throw new Error("Missing Discord ID during OAuth user creation.");
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        image: data.image,
        emailVerified: data.emailVerified ?? null,
        discordId,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: config.startingBalance,
        balanceAfter: config.startingBalance,
        type: "welcome_bonus",
        description: "Welcome bonus!",
      },
    });

    return user;
  },
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email" } },
      profile(profile) {
        const avatar = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${profile.avatar.startsWith("a_") ? "gif" : "webp"}`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator ?? "0") % 5}.png`;

        return {
          id: profile.id,
          discordId: profile.id,
          name: profile.username,
          email: profile.email,
          image: avatar,
        };
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 365 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ profile }) {
      const p = profile as { id?: string };
      if (!p?.id) return false;

      const existing = await prisma.user.findUnique({
        where: { discordId: p.id },
      });

      if (existing?.isBanned) {
        return `/login?error=banned&reason=${encodeURIComponent(
          existing.banReason ?? "Banned"
        )}`;
      }

      return true;
    },

    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        const db = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            discordId: true,
            balance: true,
            isBanned: true,
            banReason: true,
          },
        });

        if (db) Object.assign(session.user, db);
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
