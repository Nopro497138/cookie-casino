import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export async function POST() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: s.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const now = new Date();
  if (user.lastDailyBonus) {
    const diff = now.getTime() - user.lastDailyBonus.getTime();
    if (diff < 24 * 60 * 60 * 1000) {
      const next = new Date(user.lastDailyBonus.getTime() + 24 * 60 * 60 * 1000);
      return NextResponse.json({ error: "Already claimed", nextAt: next.toISOString() }, { status: 400 });
    }
  }
  const bonus = config.dailyBonus;
  const newBal = user.balance + bonus;
  await prisma.user.update({ where: { id: s.user.id }, data: { balance: newBal, lastDailyBonus: now } });
  await prisma.transaction.create({ data: { userId: s.user.id, amount: bonus, balanceAfter: newBal, type: "daily_bonus", description: "Daily bonus claimed!" } });
  return NextResponse.json({ bonus, newBalance: newBal });
}
