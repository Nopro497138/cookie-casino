import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: s.user.id }, select: { balance: true, totalWon: true, totalLost: true, gamesPlayed: true } });
  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { amount, type, game, description } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: s.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const newBal = Math.max(0, user.balance + amount);
  await prisma.user.update({ where: { id: s.user.id }, data: { balance: newBal, totalWon: amount > 0 ? { increment: amount } : undefined, totalLost: amount < 0 ? { increment: -amount } : undefined, gamesPlayed: game ? { increment: 1 } : undefined } });
  await prisma.transaction.create({ data: { userId: s.user.id, amount, balanceAfter: newBal, type: type ?? "game", game, description } });
  return NextResponse.json({ balance: newBal });
}
