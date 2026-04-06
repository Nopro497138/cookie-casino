import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const notifications = await prisma.notification.findMany({
    where: { userId: s.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ notifications });
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { action, id } = await req.json();
  if (action === "mark_read") {
    await prisma.notification.updateMany({ where: { userId: s.user.id, id: id || undefined, read: false }, data: { read: true } });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error:"Invalid action" }, { status:400 });
}
