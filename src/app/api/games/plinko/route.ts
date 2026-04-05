import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MULTIPLIERS: Record<string, number[]> = {
  low:   [1.5,1.2,1.1,1.0,0.5,1.0,1.1,1.2,1.5],
  medium:[3,1.5,1.2,0.5,0.3,0.5,1.2,1.5,3],
  high:  [100,10,3,1,0.5,1,3,10,100],
};

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { bet, risk } = await req.json();
  const user = await prisma.user.findUnique({ where:{id:s.user.id} });
  if (!user) return NextResponse.json({ error:"Not found" }, { status:404 });
  if (user.balance < bet) return NextResponse.json({ error:"Insufficient cookies" }, { status:400 });

  // Simulate 12 rows of pins, track left/right bounces
  const rows = 12;
  const path: ("L"|"R")[] = [];
  let pos = 0;
  for (let i=0;i<rows;i++) {
    const go = Math.random()<0.5 ? "R" : "L";
    path.push(go);
    if (go==="R") pos++;
  }
  const mults = MULTIPLIERS[risk ?? "medium"];
  const bucketIndex = Math.min(pos, mults.length-1);
  const mult = mults[bucketIndex];
  const win = Math.floor(bet*mult);
  const net = win - bet;
  const newBal = user.balance + net;

  await prisma.user.update({ where:{id:s.user.id}, data:{balance:newBal, totalWon:net>0?{increment:net}:undefined, totalLost:net<0?{increment:-net}:undefined, gamesPlayed:{increment:1}} });
  await prisma.transaction.create({ data:{userId:s.user.id,amount:net,balanceAfter:newBal,type:net>=0?"win":"loss",game:"plinko"} });
  return NextResponse.json({ path, bucketIndex, mult, win, net, newBalance:newBal, won:net>0 });
}
