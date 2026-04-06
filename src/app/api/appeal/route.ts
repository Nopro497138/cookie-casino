import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/config";

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { reason, additionalInfo } = await req.json();
  if (!reason) return NextResponse.json({ error:"Reason required" }, { status:400 });

  // Only banned users can appeal
  const user = await prisma.user.findUnique({ where: { id: s.user.id } });
  if (!user?.isBanned) return NextResponse.json({ error:"You are not banned" }, { status:400 });

  // Check for existing pending appeal
  const existing = await prisma.banAppeal.findFirst({ where: { userId: s.user.id, status: "pending" } });
  if (existing) return NextResponse.json({ error:"You already have a pending appeal" }, { status:400 });

  const appeal = await prisma.banAppeal.create({ data: { userId: s.user.id, reason, additionalInfo } });
  return NextResponse.json({ appeal });
}

export async function GET(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.discordId || !isAdmin(s.user.discordId))
    return NextResponse.json({ error:"Forbidden" }, { status:403 });

  const appeals = await prisma.banAppeal.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, image: true, discordId: true, banReason: true } } },
  });
  return NextResponse.json({ appeals });
}

export async function PATCH(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.discordId || !isAdmin(s.user.discordId))
    return NextResponse.json({ error:"Forbidden" }, { status:403 });

  const { appealId, action, adminNote } = await req.json();
  const appeal = await prisma.banAppeal.findUnique({ where: { id: appealId }, include: { user: true } });
  if (!appeal) return NextResponse.json({ error:"Not found" }, { status:404 });

  await prisma.banAppeal.update({ where: { id: appealId }, data: { status: action, adminNote } });

  if (action === "approved") {
    await prisma.user.update({ where: { id: appeal.userId }, data: { isBanned: false, banReason: null } });
    await prisma.session.deleteMany({ where: { userId: appeal.userId } }); // force re-login
    await prisma.notification.create({ data: { userId: appeal.userId, type: "appeal_approved", title: "✅ Appeal Approved", message: adminNote ?? "Your ban has been lifted." } });
  } else if (action === "denied") {
    await prisma.notification.create({ data: { userId: appeal.userId, type: "appeal_denied", title: "❌ Appeal Denied", message: adminNote ?? "Your appeal was reviewed and denied." } });
  }

  await prisma.adminLog.create({ data: { adminId: s.user.id, adminName: s.user.name??"Admin", action:`appeal_${action}`, targetName: appeal.user.name??undefined, details: adminNote } });
  return NextResponse.json({ success: true });
}
