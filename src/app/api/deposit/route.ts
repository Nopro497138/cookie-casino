import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { amountUSD } = await req.json();

  if (!amountUSD || amountUSD <= 0) return NextResponse.json({ error:"Invalid amount" }, { status:400 });
  const max = config.economy.maxDepositUSD ?? 100;
  if (amountUSD > max) return NextResponse.json({ error:`Max deposit is $${max}` }, { status:400 });

  // Simulate payment — in production integrate Stripe here
  const cookiesGranted = Math.floor(amountUSD * (config.economy.cookiesPerDollar ?? 1_000_000));

  await prisma.user.update({ where: { id: s.user.id }, data: { usdBalance: { increment: amountUSD } } });
  await prisma.deposit.create({ data: { userId: s.user.id, amountUSD, cookiesGranted } });
  await prisma.notification.create({
    data: { userId: s.user.id, type:"deposit", title:"💵 Deposit Received",
      message:`Deposited $${amountUSD} → 🍪${cookiesGranted.toLocaleString()} added to your USD balance.` }
  });

  // NOTE: in a real app, wait for Stripe webhook before granting funds
  return NextResponse.json({ success:true, usdBalance: amountUSD, cookiesGranted, note:"In production, integrate Stripe webhooks before granting funds." });
}
