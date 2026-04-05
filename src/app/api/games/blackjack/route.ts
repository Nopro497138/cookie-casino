import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Card = { suit: string; value: string; numeric: number };
const SUITS = ["♠","♥","♦","♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function makeDecks(n=2): Card[] {
  const deck: Card[] = [];
  for (let d=0;d<n;d++) for (const s of SUITS) for (const v of VALUES) {
    const num = v==="A"?11:["J","Q","K"].includes(v)?10:parseInt(v);
    deck.push({suit:s,value:v,numeric:num});
  }
  return deck.sort(()=>Math.random()-0.5);
}

function score(hand: Card[]): number {
  let s = hand.reduce((a,c)=>a+c.numeric,0);
  let aces = hand.filter(c=>c.value==="A").length;
  while (s>21&&aces>0) { s-=10; aces--; }
  return s;
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { action, bet, gameState } = await req.json();
  const user = await prisma.user.findUnique({ where:{id:s.user.id} });
  if (!user) return NextResponse.json({ error:"Not found" }, { status:404 });

  if (action==="deal") {
    if (user.balance < bet) return NextResponse.json({ error:"Insufficient cookies" }, { status:400 });
    const deck = makeDecks();
    const player = [deck.pop()!, deck.pop()!];
    const dealer = [deck.pop()!, deck.pop()!];
    const ps = score(player);
    if (ps===21) {
      // Blackjack!
      const win = Math.floor(bet*1.5);
      const newBal = user.balance - bet + win + bet;
      await prisma.user.update({ where:{id:s.user.id}, data:{balance:newBal,totalWon:{increment:win},gamesPlayed:{increment:1}} });
      await prisma.transaction.create({ data:{userId:s.user.id,amount:win,balanceAfter:newBal,type:"win",game:"blackjack"} });
      return NextResponse.json({ status:"blackjack", player, dealer, playerScore:21, dealerScore:score(dealer), newBalance:newBal, win });
    }
    await prisma.user.update({ where:{id:s.user.id}, data:{balance:{decrement:bet}} });
    return NextResponse.json({ status:"playing", player, deck:deck.slice(0,20), dealer:[dealer[0],{suit:"?",value:"?",numeric:0}], playerScore:ps, hiddenDealer:dealer });
  }

  if (action==="hit" || action==="stand" || action==="double") {
    const { deck: deckRaw, player: playerRaw, hiddenDealer, bet: savedBet } = gameState;
    const deck: Card[] = deckRaw;
    let player: Card[] = playerRaw;
    const dealer: Card[] = hiddenDealer;
    const bAmt = savedBet ?? bet;

    if (action==="hit") {
      player = [...player, deck.pop()!];
      const ps = score(player);
      if (ps>21) {
        await prisma.user.update({ where:{id:s.user.id}, data:{totalLost:{increment:bAmt},gamesPlayed:{increment:1}} });
        await prisma.transaction.create({ data:{userId:s.user.id,amount:-bAmt,balanceAfter:user.balance-bAmt,type:"loss",game:"blackjack"} });
        return NextResponse.json({ status:"bust", player, dealer, playerScore:ps, dealerScore:score(dealer), newBalance:user.balance-bAmt });
      }
      return NextResponse.json({ status:"playing", player, deck, dealer:[dealer[0],{suit:"?",value:"?",numeric:0}], playerScore:ps, hiddenDealer:dealer });
    }

    if (action==="double") {
      if (user.balance < bAmt) return NextResponse.json({ error:"Insufficient cookies for double" }, { status:400 });
      await prisma.user.update({ where:{id:s.user.id}, data:{balance:{decrement:bAmt}} });
      player = [...player, deck.pop()!];
    }

    // Stand or double — dealer plays
    const ps = score(player);
    let dealerHand = [...dealer];
    while (score(dealerHand)<17) dealerHand.push(deck.pop()!);
    const ds = score(dealerHand);
    const finalBet = action==="double" ? bAmt*2 : bAmt;

    let net = 0;
    let status = "push";
    if (ps>21) { status="bust"; net=-finalBet; }
    else if (ds>21||ps>ds) { status="win"; net=finalBet; }
    else if (ps<ds) { status="lose"; net=-finalBet; }

    const newBal = user.balance + (action==="double"?-bAmt:0) + net;
    await prisma.user.update({ where:{id:s.user.id}, data:{balance:{increment:net+(action==="double"?-bAmt:0)}, totalWon:net>0?{increment:net}:undefined, totalLost:net<0?{increment:-net}:undefined, gamesPlayed:{increment:1}} });
    await prisma.transaction.create({ data:{userId:s.user.id,amount:net,balanceAfter:newBal,type:net>=0?"win":"loss",game:"blackjack"} });
    return NextResponse.json({ status, player, dealer:dealerHand, playerScore:ps, dealerScore:ds, net, newBalance:newBal });
  }

  return NextResponse.json({ error:"Invalid action" }, { status:400 });
}
