import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/config";

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.discordId || !isAdmin(s.user.discordId)) return null;
  return s;
}

export async function GET(req: NextRequest) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const action = new URL(req.url).searchParams.get("action");
  const q = new URL(req.url).searchParams.get("q") ?? "";

  if (action === "users") {
    const users = await prisma.user.findMany({
      where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { discordId: { contains: q } }] } : {},
      orderBy: { balance: "desc" }, take: 50,
      select: { id: true, discordId: true, name: true, image: true, balance: true, isBanned: true, banReason: true, gamesPlayed: true, totalWon: true, totalLost: true, createdAt: true },
    });
    return NextResponse.json({ users });
  }
  if (action === "stats") {
    const [totalUsers, totalBalance, totalGames] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({ _sum: { balance: true } }),
      prisma.user.aggregate({ _sum: { gamesPlayed: true } }),
    ]);
    return NextResponse.json({ totalUsers, totalBalance: totalBalance._sum.balance ?? 0, totalGames: totalGames._sum.gamesPlayed ?? 0 });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { action, targetId, amount, reason } = await req.json();

  if (action === "give" || action === "take") {
    const user = await prisma.user.findFirst({ where: { discordId: targetId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const delta = action === "give" ? Math.abs(amount) : -Math.abs(amount);
    const newBal = Math.max(0, user.balance + delta);
    await prisma.user.update({ where: { id: user.id }, data: { balance: newBal } });
    await prisma.transaction.create({ data: { userId: user.id, amount: delta, balanceAfter: newBal, type: "admin", description: `Admin ${action}: ${reason ?? "No reason"} (by ${s.user.name})` } });
    return NextResponse.json({ success: true, newBalance: newBal });
  }
  if (action === "ban") {
    const user = await prisma.user.findFirst({ where: { discordId: targetId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    await prisma.user.update({ where: { id: user.id }, data: { isBanned: true, banReason: reason ?? "Banned by admin" } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true });
  }
  if (action === "unban") {
    await prisma.user.updateMany({ where: { discordId: targetId }, data: { isBanned: false, banReason: null } });
    return NextResponse.json({ success: true });
  }
  if (action === "reset") {
    const user = await prisma.user.findFirst({ where: { discordId: targetId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    await prisma.user.update({ where: { id: user.id }, data: { balance: 1000 } });
    await prisma.transaction.create({ data: { userId: user.id, amount: 1000 - user.balance, balanceAfter: 1000, type: "admin", description: `Balance reset by ${s.user.name}` } });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
