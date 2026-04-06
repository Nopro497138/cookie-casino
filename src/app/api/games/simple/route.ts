import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

// FIXED Roulette: proper red number set + correct color logic
const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function roulette(betType: string, betNum?: number) {
  const n = Math.floor(Math.random() * 37); // 0-36
  const color = n === 0 ? "green" : RED_NUMBERS.has(n) ? "red" : "black";
  let won = false, mult = 0;

  switch (betType) {
    case "red":   won = color === "red";   mult = 2; break;
    case "black": won = color === "black"; mult = 2; break;
    case "even":  won = n !== 0 && n % 2 === 0; mult = 2; break;
    case "odd":   won = n % 2 !== 0 && n !== 0; mult = 2; break;
    case "1-18":  won = n >= 1 && n <= 18; mult = 2; break;
    case "19-36": won = n >= 19 && n <= 36; mult = 2; break;
    case "1st12": won = n >= 1 && n <= 12; mult = 3; break;
    case "2nd12": won = n >= 13 && n <= 24; mult = 3; break;
    case "3rd12": won = n >= 25 && n <= 36; mult = 3; break;
    case "number": won = betNum !== undefined && n === betNum; mult = 36; break;
  }
  return { n, color, won, mult };
}

// FIXED Fortune Wheel: server-side weighted random, returns correct payout
function wheel(risk: string): { segment: string; mult: number } {
  type Seg = { s: string; m: number; w: number };
  const tables: Record<string, Seg[]> = {
    low: [
      { s:"0×",   m:0,    w:10 },
      { s:"0.5×", m:0.5,  w:15 },
      { s:"1×",   m:1,    w:30 },
      { s:"1.2×", m:1.2,  w:20 },
      { s:"1.5×", m:1.5,  w:14 },
      { s:"2×",   m:2,    w:8  },
      { s:"3×",   m:3,    w:2  },
      { s:"5×",   m:5,    w:0.8},
      { s:"10×",  m:10,   w:0.2},
    ],
    medium: [
      { s:"0×",   m:0,    w:35 },
      { s:"0.5×", m:0.5,  w:15 },
      { s:"1×",   m:1,    w:20 },
      { s:"1.5×", m:1.5,  w:12 },
      { s:"2×",   m:2,    w:8  },
      { s:"3×",   m:3,    w:5  },
      { s:"5×",   m:5,    w:3  },
      { s:"10×",  m:10,   w:1.5},
      { s:"25×",  m:25,   w:0.4},
      { s:"50×",  m:50,   w:0.1},
    ],
    high: [
      { s:"0×",   m:0,    w:55 },
      { s:"0.5×", m:0.5,  w:10 },
      { s:"1×",   m:1,    w:10 },
      { s:"2×",   m:2,    w:8  },
      { s:"5×",   m:5,    w:7  },
      { s:"10×",  m:10,   w:5  },
      { s:"25×",  m:25,   w:3  },
      { s:"50×",  m:50,   w:1.5},
      { s:"100×", m:100,  w:0.4},
      { s:"200×", m:200,  w:0.1},
    ],
  };

  const segs = tables[risk] ?? tables.medium;
  const total = segs.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * total;
  for (const seg of segs) {
    r -= seg.w;
    if (r <= 0) return { segment: seg.s, mult: seg.m };
  }
  return { segment: "0×", mult: 0 };
}

function slots(): { reels: string[]; mult: number } {
  const sym = ["🍪","🍪","🍪","⭐","⭐","💎","🎰","🔔","🍒","🍋"];
  const reels = Array.from({length:5}, () => sym[Math.floor(Math.random()*sym.length)]);
  const counts: Record<string,number> = {};
  reels.forEach(s => counts[s] = (counts[s]||0)+1);
  const max = Math.max(...Object.values(counts));
  const top = Object.entries(counts).find(([,v]) => v === max)?.[0] ?? "";
  const table: Record<string,Record<number,number>> = {
    "💎":{5:50,4:15,3:5},"🎰":{5:30,4:10,3:4},"⭐":{5:15,4:6,3:2.5},
    "🔔":{5:10,4:4,3:2},"🍪":{5:8,4:3,3:1.5},"🍒":{5:6,4:2.5,3:1.2},"🍋":{5:5,4:2,3:1},
  };
  return { reels, mult: max >= 3 ? (table[top]?.[max] ?? 0) : 0 };
}

function fish(rod: boolean) {
  const t = [
    {fish:"Old Boot",   emoji:"👢",val:0,   rarity:"junk",     w:15},
    {fish:"Seaweed",    emoji:"🌿",val:0,   rarity:"junk",     w:10},
    {fish:"Small Carp", emoji:"🐟",val:50,  rarity:"common",   w:30},
    {fish:"Bass",       emoji:"🐠",val:100, rarity:"common",   w:20},
    {fish:"Trout",      emoji:"🦈",val:150, rarity:"uncommon", w:12},
    {fish:"Salmon",     emoji:"🐡",val:250, rarity:"uncommon", w:7},
    {fish:"Tuna",       emoji:"🐟",val:500, rarity:"rare",     w:4},
    {fish:"Swordfish",  emoji:"⚔️",val:800, rarity:"rare",     w:2},
    {fish:"Golden Koi", emoji:"✨",val:2000,rarity:"epic",     w:rod?2:0.5},
    {fish:"Leviathan",  emoji:"🐲",val:5000,rarity:"legendary",w:rod?0.5:0.1},
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

function crash(cashOutAt: number) {
  // Provably-fair crash: house edge ~5%
  const r = Math.random();
  const rawCrash = r < 0.05 ? 1.00 : parseFloat(Math.max(1, (0.99 / r)).toFixed(2));
  const cp = Math.min(rawCrash, 1000);
  const won = cashOutAt <= cp;
  return { cp, won, mult: won ? cashOutAt : 0 };
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const body = await req.json();
  const { game, bet, ...gd } = body;
  const minBet = config.games.minBet;
  const maxBet = config.games.maxBet;

  if (bet < minBet) return NextResponse.json({ error:`Min bet: ${minBet}` }, { status:400 });
  if (bet > maxBet) return NextResponse.json({ error:`Max bet: ${maxBet}` }, { status:400 });

  const user = await prisma.user.findUnique({ where: { id: s.user.id } });
  if (!user) return NextResponse.json({ error:"Not found" }, { status:404 });
  if (user.isBanned) return NextResponse.json({ error:"Banned" }, { status:403 });
  if (user.balance < bet) return NextResponse.json({ error:"Insufficient cookies" }, { status:400 });

  let result: Record<string,unknown> = {};
  let net = -bet;

  switch (game) {
    case "dice": {
      const { target, over } = gd;
      const roll = Math.floor(Math.random()*100)+1;
      const won = over ? roll > target : roll < target;
      const chance = over ? (100-target)/100 : target/100;
      const mult = parseFloat(((1/chance)*0.95).toFixed(4));
      if (won) net = Math.floor(bet*mult)-bet;
      result = { roll, won, mult, target, over };
      break;
    }
    case "slots": {
      const { reels, mult } = slots();
      if (mult > 0) net = Math.floor(bet*mult)-bet;
      result = { reels, mult };
      break;
    }
    case "roulette": {
      const r = roulette(gd.betType, gd.betNum);
      if (r.won) net = Math.floor(bet*r.mult)-bet;
      result = r;
      break;
    }
    case "crash": {
      const cr = crash(gd.cashOutAt);
      if (cr.won) net = Math.floor(bet*gd.cashOutAt)-bet;
      result = cr;
      break;
    }
    case "coinflip": {
      const flip = Math.random()<0.5 ? "heads" : "tails";
      const won = flip === gd.choice;
      if (won) net = bet;
      result = { flip, won, choice: gd.choice };
      break;
    }
    case "fishing": {
      const f = fish(gd.hasRod ?? false);
      net = f.value > 0 ? f.value - bet : -bet;
      result = f;
      break;
    }
    case "keno": {
      const k = keno(gd.picks);
      net = Math.floor(bet*k.mult)-bet;
      result = k;
      break;
    }
    case "wheel": {
      // FIXED: use server-side weighted random, not client segment index
      const w = wheel(gd.risk ?? "medium");
      net = Math.floor(bet*w.mult)-bet;
      result = w;
      break;
    }
    default:
      return NextResponse.json({ error:"Unknown game" }, { status:400 });
  }

  const newBal = user.balance + net;
  await prisma.user.update({
    where: { id: s.user.id },
    data: {
      balance: newBal,
      totalWon: net>0 ? { increment: net } : undefined,
      totalLost: net<0 ? { increment: -net } : undefined,
      gamesPlayed: { increment: 1 },
    },
  });
  await prisma.transaction.create({ data: { userId:s.user.id, amount:net, balanceAfter:newBal, type:net>=0?"win":"loss", game } });

  return NextResponse.json({ result, net, newBalance:newBal, won: net>0 });
}
