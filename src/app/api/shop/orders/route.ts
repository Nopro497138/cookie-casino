import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/config";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  if (isAdmin(s.user.discordId)) {
    // Admins see all orders
    const orders = await prisma.shopOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name:true, image:true, discordId:true } }, messages: { orderBy: { createdAt:"asc" }, include: { user: { select: { name:true, image:true } } } } },
    });
    return NextResponse.json({ orders });
  }

  // Users see own orders
  const orders = await prisma.shopOrder.findMany({
    where: { userId: s.user.id },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt:"asc" }, include: { user: { select: { name:true, image:true } } } } },
  });
  return NextResponse.json({ orders });
}
