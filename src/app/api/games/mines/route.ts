import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function calcMult(revealed: number, mines: number, total=25): number {
  if (revealed===0) return 1;
  let mult = 1;
  for (let i=0;i<revealed;i++) {
    mult *= (total-mines-i)/(total-i);
  }
  return parseFloat((0.99/mult).toFixed(4));
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { action, bet, mineCount, gameState, cellIndex } = await req.json();
  const user = await prisma.user.findUnique({ where:{id:s.user.id} });
  if (!user) return NextResponse.json({ error:"Not found" }, { status:404 });

  if (action==="start") {
    if (user.balance < bet) return NextResponse.json({ error:"Insufficient cookies" }, { status:400 });
    const mines = Math.min(Math.max(mineCount||3,1),24);
    const positions = Array.from({length:25},(_,i)=>i).sort(()=>Math.random()-0.5).slice(0,mines);
    await prisma.user.update({ where:{id:s.user.id}, data:{balance:{decrement:bet}} });
    return NextResponse.json({ minePositions:positions, revealed:[], nextMult:calcMult(0,mines), bet, mineCount:mines, status:"playing" });
  }

  if (action==="reveal") {
    const { minePositions, revealed, bet:b, mineCount:mc } = gameState;
    if (minePositions.includes(cellIndex)) {
      await prisma.user.update({ where:{id:s.user.id}, data:{totalLost:{increment:b},gamesPlayed:{increment:1}} });
      await prisma.transaction.create({ data:{userId:s.user.id,amount:-b,balanceAfter:user.balance-b,type:"loss",game:"mines"} });
      return NextResponse.json({ status:"dead", minePositions, revealed, newBalance:user.balance-b });
    }
    const newRevealed = [...revealed, cellIndex];
    const total = 25-mc;
    if (newRevealed.length >= total) {
      const win = Math.floor(b*calcMult(newRevealed.length,mc));
      const newBal = user.balance + win;
      await prisma.user.update({ where:{id:s.user.id}, data:{balance:{increment:win},totalWon:{increment:win},gamesPlayed:{increment:1}} });
      await prisma.transaction.create({ data:{userId:s.user.id,amount:win,balanceAfter:newBal,type:"win",game:"mines"} });
      return NextResponse.json({ status:"complete", revealed:newRevealed, minePositions, win, newBalance:newBal });
    }
    return NextResponse.json({ status:"playing", revealed:newRevealed, nextMult:calcMult(newRevealed.length,mc), minePositions:[] });
  }

  if (action==="cashout") {
    const { minePositions, revealed, bet:b, mineCount:mc } = gameState;
    if (revealed.length===0) {
      await prisma.user.update({ where:{id:s.user.id}, data:{balance:{increment:b}} });
      return NextResponse.json({ status:"refund", newBalance:user.balance+b });
    }
    const win = Math.floor(b*calcMult(revealed.length,mc));
    const newBal = user.balance + win;
    await prisma.user.update({ where:{id:s.user.id}, data:{balance:{increment:win},totalWon:{increment:win-b},gamesPlayed:{increment:1}} });
    await prisma.transaction.create({ data:{userId:s.user.id,amount:win-b,balanceAfter:newBal,type:"win",game:"mines"} });
    return NextResponse.json({ status:"cashout", minePositions, revealed, win, newBalance:newBal });
  }

  return NextResponse.json({ error:"Invalid action" }, { status:400 });
}
