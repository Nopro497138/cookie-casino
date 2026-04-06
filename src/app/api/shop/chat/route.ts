import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/config";

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { orderId, content, action } = await req.json();

  const order = await prisma.shopOrder.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error:"Order not found" }, { status:404 });

  const admin = isAdmin(s.user.discordId);
  if (!admin && order.userId !== s.user.id) return NextResponse.json({ error:"Forbidden" }, { status:403 });

  if (action === "toggle_chat") {
    if (!admin) return NextResponse.json({ error:"Forbidden" }, { status:403 });
    await prisma.shopOrder.update({ where: { id: orderId }, data: { chatOpen: !order.chatOpen } });
    return NextResponse.json({ chatOpen: !order.chatOpen });
  }

  if (action === "close_order") {
    if (!admin) return NextResponse.json({ error:"Forbidden" }, { status:403 });
    await prisma.shopOrder.update({ where: { id: orderId }, data: { status:"completed", chatOpen:false } });
    await prisma.notification.create({ data: { userId: order.userId, type:"order_complete", title:"✅ Order Completed", message:`Your order for **${order.itemName}** has been completed!` } });
    return NextResponse.json({ success:true });
  }

  if (!content?.trim()) return NextResponse.json({ error:"Empty message" }, { status:400 });
  if (!order.chatOpen) return NextResponse.json({ error:"Chat is closed" }, { status:400 });

  const msg = await prisma.chatMessage.create({
    data: { orderId, userId: s.user.id, content: content.trim(), isAdmin: admin },
    include: { user: { select: { name:true, image:true } } },
  });

  // Notify the other party
  const notifyUserId = admin ? order.userId : undefined;
  if (notifyUserId) {
    await prisma.notification.create({ data: { userId: notifyUserId, type:"chat_message", title:"💬 New Message", message:`Admin replied on your order: ${order.itemName}`, metadata: orderId } });
  }

  return NextResponse.json({ message: msg });
}
