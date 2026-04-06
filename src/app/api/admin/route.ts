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

async function log(adminId: string, adminName: string, action: string, targetName?: string, details?: string) {
  await prisma.adminLog.create({ data: { adminId, adminName, action, targetName, details } });
}

export async function GET(req: NextRequest) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error:"Forbidden" }, { status:403 });
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const q = searchParams.get("q") ?? "";

  if (action === "users") {
    const users = await prisma.user.findMany({
      where: q ? { OR: [{ name: { contains:q, mode:"insensitive" } }, { discordId: { contains:q } }] } : {},
      orderBy: { balance:"desc" }, take:50,
      select: { id:true, discordId:true, name:true, image:true, balance:true, usdBalance:true, isBanned:true, banReason:true, gamesPlayed:true, totalWon:true, totalLost:true, createdAt:true },
    });
    return NextResponse.json({ users });
  }
  if (action === "stats") {
    const [totalUsers, agg, txAgg] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({ _sum: { balance:true, gamesPlayed:true } }),
      prisma.transaction.count(),
    ]);
    return NextResponse.json({ totalUsers, totalBalance: agg._sum.balance??0, totalGames: agg._sum.gamesPlayed??0, totalTransactions: txAgg });
  }
  if (action === "logs") {
    const logs = await prisma.adminLog.findMany({ orderBy: { createdAt:"desc" }, take:100 });
    return NextResponse.json({ logs });
  }
  if (action === "appeals") {
    const appeals = await prisma.banAppeal.findMany({
      orderBy: { createdAt:"desc" },
      include: { user: { select: { name:true, image:true, discordId:true, banReason:true } } },
    });
    return NextResponse.json({ appeals });
  }
  return NextResponse.json({ error:"Invalid action" }, { status:400 });
}

export async function POST(req: NextRequest) {
  const s = await requireAdmin();
  if (!s) return NextResponse.json({ error:"Forbidden" }, { status:403 });
  const body = await req.json();
  const { action, targetId, amount, reason, message, title, appealId, adminNote } = body;

  if (action === "give" || action === "take") {
    const user = await prisma.user.findFirst({ where: { discordId: targetId } });
    if (!user) return NextResponse.json({ error:"User not found" }, { status:404 });
    const delta = action==="give" ? Math.abs(amount) : -Math.abs(amount);
    const newBal = Math.max(0, user.balance + delta);
    await prisma.user.update({ where: { id:user.id }, data: { balance: newBal } });
    await prisma.transaction.create({ data: { userId:user.id, amount:delta, balanceAfter:newBal, type:"admin", description:`Admin ${action}: ${reason??"No reason"} (by ${s.user.name})` } });
    await prisma.notification.create({ data: { userId:user.id, type:"admin_balance", title: delta>0?"🍪 Cookies Added":"🍪 Cookies Removed", message:`An admin ${action==="give"?"gave you":"removed"} 🍪${Math.abs(delta)} cookies.${reason?` Reason: ${reason}`:""}` } });
    await log(s.user.id, s.user.name??"Admin", action, user.name??undefined, `${delta>0?"+":""}${delta} cookies. Reason: ${reason}`);
    return NextResponse.json({ success:true, newBalance:newBal });
  }

  if (action === "ban") {
    const user = await prisma.user.findFirst({ where: { discordId: targetId } });
    if (!user) return NextResponse.json({ error:"User not found" }, { status:404 });
    await prisma.user.update({ where: { id:user.id }, data: { isBanned:true, banReason:reason??"Banned by admin" } });
    await prisma.session.deleteMany({ where: { userId:user.id } });
    await log(s.user.id, s.user.name??"Admin", "ban", user.name??undefined, reason);
    return NextResponse.json({ success:true });
  }

  if (action === "unban") {
    const user = await prisma.user.findFirst({ where: { discordId: targetId } });
    if (!user) return NextResponse.json({ error:"User not found" }, { status:404 });
    await prisma.user.update({ where: { id:user.id }, data: { isBanned:false, banReason:null } });
    await prisma.notification.create({ data: { userId:user.id, type:"unban", title:"✅ You have been unbanned", message:"Your ban has been lifted. Welcome back!" } });
    await log(s.user.id, s.user.name??"Admin", "unban", user.name??undefined);
    return NextResponse.json({ success:true });
  }

  if (action === "reset") {
    const user = await prisma.user.findFirst({ where: { discordId: targetId } });
    if (!user) return NextResponse.json({ error:"User not found" }, { status:404 });
    await prisma.user.update({ where: { id:user.id }, data: { balance:1000 } });
    await log(s.user.id, s.user.name??"Admin", "reset_balance", user.name??undefined);
    return NextResponse.json({ success:true });
  }

  if (action === "mute_game") {
    // Kick from presence (soft mute: just log it)
    await log(s.user.id, s.user.name??"Admin", "mute_game", targetId, `Muted in: ${reason}`);
    return NextResponse.json({ success:true });
  }

  if (action === "announce") {
    const ann = await prisma.announcement.create({ data: { adminId:s.user.id, adminName:s.user.name??"Admin", title, message, pinned:false } });
    const users = await prisma.user.findMany({ select: { id:true } });
    await prisma.notification.createMany({ data: users.map(u => ({ userId:u.id, type:"announcement", title:`📢 ${title}`, message })) });
    await log(s.user.id, s.user.name??"Admin", "announce", undefined, `"${title}"`);
    return NextResponse.json({ announcement:ann });
  }

  if (action === "appeal_review") {
    const appeal = await prisma.banAppeal.findUnique({ where: { id: appealId }, include: { user:true } });
    if (!appeal) return NextResponse.json({ error:"Not found" }, { status:404 });
    await prisma.banAppeal.update({ where: { id:appealId }, data: { status:body.verdict, adminNote } });
    if (body.verdict === "approved") {
      await prisma.user.update({ where: { id:appeal.userId }, data: { isBanned:false, banReason:null } });
      await prisma.notification.create({ data: { userId:appeal.userId, type:"appeal_approved", title:"✅ Appeal Approved", message: adminNote??"Your ban has been lifted." } });
    } else {
      await prisma.notification.create({ data: { userId:appeal.userId, type:"appeal_denied", title:"❌ Appeal Denied", message: adminNote??"Your appeal was reviewed and denied." } });
    }
    await log(s.user.id, s.user.name??"Admin", `appeal_${body.verdict}`, appeal.user.name??undefined, adminNote);
    return NextResponse.json({ success:true });
  }

  if (action === "add_usd") {
    const user = await prisma.user.findFirst({ where: { discordId: targetId } });
    if (!user) return NextResponse.json({ error:"User not found" }, { status:404 });
    await prisma.user.update({ where: { id:user.id }, data: { usdBalance:{ increment: amount } } });
    await log(s.user.id, s.user.name??"Admin", "add_usd", user.name??undefined, `+$${amount}`);
    return NextResponse.json({ success:true });
  }

  return NextResponse.json({ error:"Invalid action" }, { status:400 });
}
