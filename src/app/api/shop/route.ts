import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shopConfig, isAdmin } from "@/lib/config";

export async function GET() {
  return NextResponse.json({ items: shopConfig.items });
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { itemId } = await req.json();
  const item = shopConfig.items.find(i => i.id === itemId);
  if (!item || !item.available) return NextResponse.json({ error:"Item not available" }, { status:404 });

  const user = await prisma.user.findUnique({ where: { id: s.user.id } });
  if (!user) return NextResponse.json({ error:"Not found" }, { status:404 });
  if (user.usdBalance < item.priceUSD)
    return NextResponse.json({ error:`Insufficient balance. Need $${item.priceUSD}` }, { status:400 });

  const order = await prisma.shopOrder.create({
    data: { userId: s.user.id, itemId, itemName: item.name, priceUSD: item.priceUSD, status: "open", chatOpen: true },
  });
  await prisma.user.update({ where: { id: s.user.id }, data: { usdBalance: { increment: -item.priceUSD } } });

  // Auto-message in chat
  await prisma.chatMessage.create({
    data: { orderId: order.id, userId: s.user.id, isAdmin: false,
      content: `I just purchased **${item.name}** ($${item.priceUSD}). Please process my order. 🛍️` },
  });

  // Notify admins (via notification to admin users)
  const admins = await prisma.user.findMany({ where: { OR: [{ discordId: { in: (await import("../../../lib/config")).config.admins } }] } });
  await prisma.notification.createMany({
    data: admins.map(a => ({ userId: a.id, type: "shop_order", title: `🛍️ New Order: ${item.name}`, message: `${user.name} purchased ${item.name} for $${item.priceUSD}`, metadata: order.id })),
  });

  return NextResponse.json({ order });
}
