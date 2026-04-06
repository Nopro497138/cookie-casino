
"use client";
import { useEffect, useState } from "react";

interface Player { userId: string; name: string; avatar: string; }

export function PlayerCount({ game }: { game: string }) {
  const [count, setCount] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    const load = () => fetch(`/api/presence?game=${game}`).then(r=>r.json()).then(d=>{setCount(d.count);setPlayers(d.players??[]);});
    // Join
    fetch("/api/presence", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ game, action:"join" }) });
    load();
    const hb = setInterval(() => { fetch("/api/presence",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game,action:"join"})}); load(); }, 15000);
    return () => { clearInterval(hb); fetch("/api/presence",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game,action:"leave"})}); };
  }, [game]);

  return (
    <div className="relative">
      <button onClick={()=>setShowList(v=>!v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all hover:bg-white/5"
        style={{ color:"#94a3b8" }}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        {count} playing
        {count > 1 && <span className="ml-0.5">👁</span>}
      </button>
      {showList && players.length > 0 && (
        <div className="absolute top-full mt-1 right-0 glass rounded-xl p-2 min-w-[140px] z-20" style={{ border:"1px solid rgba(255,255,255,0.1)" }}>
          {players.slice(0,8).map(p=>(
            <div key={p.userId} className="flex items-center gap-2 px-2 py-1 text-xs text-slate-300">
              {p.avatar ? <img src={p.avatar} className="w-4 h-4 rounded-full" alt="" /> : <div className="w-4 h-4 rounded-full bg-purple-500/30" />}
              <span className="truncate">{p.name}</span>
            </div>
          ))}
          {players.length > 8 && <p className="text-xs text-slate-500 px-2">+{players.length-8} more</p>}
        </div>
      )}
    </div>
  );
}
