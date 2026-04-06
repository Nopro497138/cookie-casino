import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/config";

export async function GET() {
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.discordId || !isAdmin(s.user.discordId))
    return NextResponse.json({ error:"Forbidden" }, { status:403 });
  const { title, message, pinned } = await req.json();
  if (!title || !message) return NextResponse.json({ error:"Missing fields" }, { status:400 });

  const ann = await prisma.announcement.create({
    data: { adminId: s.user.id, adminName: s.user.name ?? "Admin", title, message, pinned: !!pinned },
  });
  await prisma.adminLog.create({ data: { adminId: s.user.id, adminName: s.user.name??"Admin", action:"announce", details:`Posted: "${title}"` } });

  // Notify all users
  const users = await prisma.user.findMany({ select: { id: true } });
  await prisma.notification.createMany({
    data: users.map(u => ({ userId: u.id, type: "announcement", title: `📢 ${title}`, message })),
  });

  return NextResponse.json({ announcement: ann });
}

export async function DELETE(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.discordId || !isAdmin(s.user.discordId))
    return NextResponse.json({ error:"Forbidden" }, { status:403 });
  const { id } = await req.json();
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
