import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

function slots(): { reels: string[]; mult: number } {
  const sym = ["🍪","🍪","🍪","⭐","⭐","💎","🎰","🔔","🍒","🍋"];
  const reels = Array.from({length:5}, () => sym[Math.floor(Math.random()*sym.length)]);
  const counts: Record<string,number> = {};
  reels.forEach(s => counts[s] = (counts[s]||0)+1);
  const max = Math.max(...Object.values(counts));
  const top = Object.entries(counts).find(([,v]) => v===max)?.[0] ?? "";
  const table: Record<string,Record<number,number>> = {
    "💎":{5:50,4:15,3:5},"🎰":{5:30,4:10,3:4},"⭐":{5:15,4:6,3:2.5},
    "🔔":{5:10,4:4,3:2},"🍪":{5:8,4:3,3:1.5},"🍒":{5:6,4:2.5,3:1.2},"🍋":{5:5,4:2,3:1},
  };
  return { reels, mult: max>=3 ? (table[top]?.[max] ?? 0) : 0 };
}

function roulette(betType: string, betNum?: number) {
  const n = Math.floor(Math.random()*37);
  const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const color = n===0 ? "green" : reds.includes(n) ? "red" : "black";
  let won=false, mult=0;
  if (betType==="red"){won=color==="red";mult=2;}
  else if (betType==="black"){won=color==="black";mult=2;}
  else if (betType==="even"){won=n!==0&&n%2===0;mult=2;}
  else if (betType==="odd"){won=n%2!==0;mult=2;}
  else if (betType==="1-18"){won=n>=1&&n<=18;mult=2;}
  else if (betType==="19-36"){won=n>=19&&n<=36;mult=2;}
  else if (betType==="1st12"){won=n>=1&&n<=12;mult=3;}
  else if (betType==="2nd12"){won=n>=13&&n<=24;mult=3;}
  else if (betType==="3rd12"){won=n>=25&&n<=36;mult=3;}
  else if (betType==="number"&&betNum!==undefined){won=n===betNum;mult=36;}
  return {n,color,won,mult};
}

function crash(cashOutAt: number) {
  const r = Math.random();
  const cp = r < 0.05 ? 1 : Math.max(1, Math.min(parseFloat(((1/(r-0.05))*0.95+1).toFixed(2)), 1000));
  return {cp, won: cashOutAt<=cp, mult: cashOutAt<=cp ? cashOutAt : 0};
}

function fish(rod: boolean) {
  const t = [
    {fish:"Old Boot",emoji:"👢",val:0,rarity:"junk",w:15},
    {fish:"Seaweed",emoji:"🌿",val:0,rarity:"junk",w:10},
    {fish:"Small Carp",emoji:"🐟",val:50,rarity:"common",w:30},
    {fish:"Bass",emoji:"🐠",val:100,rarity:"common",w:20},
    {fish:"Trout",emoji:"🦈",val:150,rarity:"uncommon",w:12},
    {fish:"Salmon",emoji:"🐡",val:250,rarity:"uncommon",w:7},
    {fish:"Tuna",emoji:"🐟",val:500,rarity:"rare",w:4},
    {fish:"Swordfish",emoji:"⚔️",val:800,rarity:"rare",w:2},
    {fish:"Golden Koi",emoji:"✨",val:2000,rarity:"epic",w:rod?2:0.5},
    {fish:"Leviathan",emoji:"🐲",val:5000,rarity:"legendary",w:rod?0.5:0.1},
  ];
  const boosted = rod ? t.map(f=>({...f,w:f.rarity==="junk"?f.w*0.3:f.w*1.5})) : t;
  const total = boosted.reduce((s,f)=>s+f.w,0);
  let r = Math.random()*total;
  for (const f of boosted) { r-=f.w; if(r<=0) return {name:f.fish,emoji:f.emoji,value:rod?f.val*2:f.val,rarity:f.rarity}; }
  return {name:"Small Carp",emoji:"🐟",value:50,rarity:"common"};
}

function keno(picks: number[]) {
  const all = Array.from({length:80},(_,i)=>i+1);
  const drawn = [...all].sort(()=>Math.random()-0.5).slice(0,20);
  const matches = picks.filter(p=>drawn.includes(p)).length;
  const table: Record<number,Record<number,number>> = {
    1:{0:0,1:3.8},2:{0:0,1:1,2:9},3:{0:0,1:0.5,2:2.5,3:27},
    4:{0:0,1:0,2:1.5,3:5,4:100},5:{0:0,1:0,2:0.5,3:3,4:15,5:300},
    6:{0:0,1:0,2:0,3:1.5,4:5,5:50,6:1000},
    7:{0:0,1:0,2:0,3:1,4:3,5:15,6:200,7:5000},
    8:{0:0,1:0,2:0,3:0.5,4:2,5:8,6:50,7:500,8:10000},
  };
  const mult = table[Math.min(picks.length,8)]?.[matches] ?? 0;
  return {drawn, matches, mult};
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { game, bet, ...gd } = body;
  if (bet < config.games.minBet) return NextResponse.json({ error: `Min bet: ${config.games.minBet}` }, { status: 400 });
  if (bet > config.games.maxBet) return NextResponse.json({ error: `Max bet: ${config.games.maxBet}` }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: s.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.isBanned) return NextResponse.json({ error: "Banned" }, { status: 403 });
  if (user.balance < bet) return NextResponse.json({ error: "Insufficient cookies" }, { status: 400 });

  let result: Record<string,unknown> = {};
  let net = -bet;

  switch(game) {
    case "dice": {
      const {target, over} = gd;
      const roll = Math.floor(Math.random()*100)+1;
      const won = over ? roll > target : roll < target;
      const chance = over ? (100-target)/100 : target/100;
      const mult = parseFloat(((1/chance)*0.95).toFixed(4));
      if (won) net = Math.floor(bet*mult)-bet;
      result = {roll, won, mult, target, over};
      break;
    }
    case "slots": {
      const {reels,mult} = slots();
      if (mult>0) net = Math.floor(bet*mult)-bet;
      result = {reels, mult};
      break;
    }
    case "roulette": {
      const {betType,betNum} = gd;
      const r = roulette(betType, betNum);
      if (r.won) net = Math.floor(bet*r.mult)-bet;
      result = r;
      break;
    }
    case "crash": {
      const {cashOutAt} = gd;
      const cr = crash(cashOutAt);
      if (cr.won) net = Math.floor(bet*cashOutAt)-bet;
      result = cr;
      break;
    }
    case "coinflip": {
      const {choice} = gd;
      const flip = Math.random()<0.5?"heads":"tails";
      const won = flip===choice;
      if (won) net = bet;
      result = {flip, won, choice};
      break;
    }
    case "fishing": {
      const f = fish(gd.hasRod ?? false);
      net = f.value > 0 ? f.value - bet : -bet;
      result = f;
      break;
    }
    case "keno": {
      const {picks} = gd;
      const k = keno(picks);
      net = Math.floor(bet*k.mult)-bet;
      result = k;
      break;
    }
    case "wheel": {
      const segments = gd.risk==="low"
        ? [{s:"0.5x",m:0.5,w:5},{s:"1x",m:1,w:30},{s:"1.5x",m:1.5,w:25},{s:"2x",m:2,w:20},{s:"3x",m:3,w:12},{s:"5x",m:5,w:6},{s:"10x",m:10,w:2}]
        : gd.risk==="high"
        ? [{s:"0x",m:0,w:40},{s:"2x",m:2,w:20},{s:"5x",m:5,w:15},{s:"10x",m:10,w:12},{s:"25x",m:25,w:8},{s:"50x",m:50,w:4},{s:"100x",m:100,w:1}]
        : [{s:"0x",m:0,w:15},{s:"0.5x",m:0.5,w:10},{s:"1.5x",m:1.5,w:25},{s:"2x",m:2,w:20},{s:"3x",m:3,w:15},{s:"5x",m:5,w:10},{s:"20x",m:20,w:5}];
      const total = segments.reduce((a,b)=>a+b.w,0);
      let r = Math.random()*total;
      let seg = segments[0];
      for (const ss of segments) { r-=ss.w; if(r<=0){seg=ss;break;} }
      net = Math.floor(bet*seg.m)-bet;
      result = {segment:seg.s, mult:seg.m};
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown game" }, { status: 400 });
  }

  const newBal = user.balance + net;
  await prisma.user.update({ where:{id:s.user.id}, data:{balance:newBal, totalWon:net>0?{increment:net}:undefined, totalLost:net<0?{increment:-net}:undefined, gamesPlayed:{increment:1}} });
  await prisma.transaction.create({ data:{userId:s.user.id,amount:net,balanceAfter:newBal,type:net>=0?"win":"loss",game} });
  return NextResponse.json({ result, net, newBalance: newBal, won: net > 0 });
}
