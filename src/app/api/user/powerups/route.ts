import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { POWERUPS } from "@/lib/powerups";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owned = await prisma.userPowerup.findMany({ where: { userId: s.user.id } });
  return NextResponse.json({ owned, catalog: POWERUPS });
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { powerupId, action } = await req.json();
  const powerup = POWERUPS.find((p) => p.id === powerupId);
  if (!powerup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "buy") {
    const user = await prisma.user.findUnique({ where: { id: s.user.id } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.balance < powerup.price) return NextResponse.json({ error: "Insufficient cookies" }, { status: 400 });
    const newBal = user.balance - powerup.price;
    await prisma.$transaction([
      prisma.user.update({ where: { id: s.user.id }, data: { balance: newBal } }),
      prisma.userPowerup.upsert({ where: { userId_powerupId: { userId: s.user.id, powerupId } }, update: { quantity: { increment: 1 } }, create: { userId: s.user.id, powerupId, quantity: 1 } }),
      prisma.transaction.create({ data: { userId: s.user.id, amount: -powerup.price, balanceAfter: newBal, type: "purchase", description: `Purchased ${powerup.name}` } }),
    ]);
    return NextResponse.json({ success: true, newBalance: newBal });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
