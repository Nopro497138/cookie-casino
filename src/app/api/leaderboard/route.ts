import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/config";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { isBanned: false },
    orderBy: { balance: "desc" },
    take: 50,
    select: { id: true, discordId: true, name: true, image: true, balance: true, totalWon: true, gamesPlayed: true },
  });
  return NextResponse.json({ leaderboard: users.map((u, i) => ({ rank: i + 1, ...u, isAdmin: isAdmin(u.discordId) })) });
}
