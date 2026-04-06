import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Simple in-process presence store
const presence: Record<string, { userId: string; name: string; avatar: string; ts: number }[]> = {};
const TTL = 30_000; // 30s heartbeat

function cleanup() {
  const now = Date.now();
  for (const game of Object.keys(presence)) {
    presence[game] = presence[game].filter(p => now - p.ts < TTL);
    if (!presence[game].length) delete presence[game];
  }
}

export async function GET(req: NextRequest) {
  cleanup();
  const game = new URL(req.url).searchParams.get("game");
  if (game) {
    return NextResponse.json({ players: presence[game] ?? [], count: (presence[game] ?? []).length });
  }
  const counts: Record<string,number> = {};
  for (const [g, players] of Object.entries(presence)) counts[g] = players.length;
  return NextResponse.json({ counts });
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  cleanup();
  const { game, action } = await req.json();
  if (!game) return NextResponse.json({ error:"game required" }, { status:400 });

  if (!presence[game]) presence[game] = [];

  if (action === "leave") {
    presence[game] = presence[game].filter(p => p.userId !== s.user.id);
  } else {
    const idx = presence[game].findIndex(p => p.userId === s.user.id);
    const entry = { userId: s.user.id, name: s.user.name ?? "Player", avatar: s.user.image ?? "", ts: Date.now() };
    if (idx >= 0) presence[game][idx] = entry;
    else presence[game].push(entry);
  }
  return NextResponse.json({ count: presence[game].length });
}
