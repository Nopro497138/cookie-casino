import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { POWERUPS } from "@/lib/powerups";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const owned = await prisma.userPowerup.findMany({ where: { userId: s.user.id } });
  return NextResponse.json({ owned, catalog: POWERUPS });
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { powerupId, action } = await req.json();
  const powerup = POWERUPS.find(p => p.id === powerupId);
  if (!powerup) return NextResponse.json({ error:"Not found" }, { status:404 });

  if (action === "buy") {
    const user = await prisma.user.findUnique({ where: { id: s.user.id } });
    if (!user) return NextResponse.json({ error:"Not found" }, { status:404 });
    if (user.balance < powerup.price) return NextResponse.json({ error:"Insufficient cookies" }, { status:400 });
    const newBal = user.balance - powerup.price;
    await prisma.$transaction([
      prisma.user.update({ where:{ id:s.user.id }, data:{ balance:newBal } }),
      prisma.userPowerup.upsert({ where:{ userId_powerupId:{ userId:s.user.id, powerupId } }, update:{ quantity:{ increment:1 } }, create:{ userId:s.user.id, powerupId, quantity:1 } }),
      prisma.transaction.create({ data:{ userId:s.user.id, amount:-powerup.price, balanceAfter:newBal, type:"purchase", description:`Purchased ${powerup.name}` } }),
    ]);
    return NextResponse.json({ success:true, newBalance:newBal });
  }

  if (action === "use") {
    const ownedPowerup = await prisma.userPowerup.findUnique({ where:{ userId_powerupId:{ userId:s.user.id, powerupId } } });
    if (!ownedPowerup || ownedPowerup.quantity < 1) return NextResponse.json({ error:"Not owned" }, { status:400 });

    if (ownedPowerup.quantity <= 1) {
      await prisma.userPowerup.delete({ where:{ userId_powerupId:{ userId:s.user.id, powerupId } } });
    } else {
      await prisma.userPowerup.update({ where:{ userId_powerupId:{ userId:s.user.id, powerupId } }, data:{ quantity:{ decrement:1 } } });
    }

    // Apply powerup effect
    const user = await prisma.user.findUnique({ where:{ id:s.user.id } });
    if (!user) return NextResponse.json({ error:"User not found" }, { status:404 });

    let bonusAmount = 0;
    let effectDesc = powerup.description;

    if (powerup.id === "cookie_jar") {
      bonusAmount = 1000;
      await prisma.user.update({ where:{ id:s.user.id }, data:{ balance:{ increment:bonusAmount } } });
      await prisma.transaction.create({ data:{ userId:s.user.id, amount:bonusAmount, balanceAfter:user.balance+bonusAmount, type:"powerup", description:`Used Cookie Jar: +🍪1,000` } });
    }

    return NextResponse.json({ success:true, effect:powerup.id, description:effectDesc, bonusAmount });
  }

  return NextResponse.json({ error:"Invalid action" }, { status:400 });
}
