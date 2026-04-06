
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";
import { playSFX } from "@/lib/sfx";

const RARITY_COLOR: Record<string,string> = { junk:"#64748b", common:"#94a3b8", uncommon:"#10b981", rare:"#3b82f6", epic:"#a855f7", legendary:"#f59e0b" };

export function Fishing({ balance, onBalanceChange, hasRod=false }: { balance:number; onBalanceChange:(n:number)=>void; hasRod?:boolean }) {
  const [bet, setBet] = useState(50);
  const [phase, setPhase] = useState<"idle"|"casting"|"waiting"|"reeling"|"done">("idle");
  const [catch_, setCatch] = useState<{ name:string; emoji:string; value:number; rarity:string }|null>(null);
  const [net, setNet] = useState(0);

  const cast = async () => {
    setPhase("casting"); setCatch(null);
    playSFX("fish_cast", 0.5);
    await new Promise(r => setTimeout(r, 800));
    setPhase("waiting");
    const wait = 1500 + Math.random()*2000;
    await new Promise(r => setTimeout(r, wait));
    playSFX("fish_bite", 0.6);
    setPhase("reeling");
    const res = await fetch("/api/games/simple", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ game:"fishing", bet, hasRod }) });
    const d = await res.json();
    if (!d.error) {
      await new Promise(r => setTimeout(r, 500));
      if (d.result.rarity === "junk") playSFX("fish_junk", 0.3); else playSFX("fish_catch", 0.5);
      if (d.won) playSFX("win", 0.3);
      setCatch(d.result); setNet(d.net); onBalanceChange(d.newBalance); setPhase("done");
    } else setPhase("idle");
  };

  const color = catch_ ? RARITY_COLOR[catch_.rarity] : "#64748b";

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background:"linear-gradient(180deg,rgba(8,45,88,0.8),rgba(4,120,87,0.3),rgba(8,8,15,0.8))", border:"1px solid rgba(59,130,246,0.2)" }}>
        <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20" style={{ background:"linear-gradient(0deg,rgba(59,130,246,0.5),transparent)" }} />
        {(phase==="waiting"||phase==="idle") && ["🐟","🐠","🐡"].map((f,i)=>(
          <motion.div key={i} animate={{ x:["-10%","110%"], y:[0,Math.sin(i)*18,0] }}
            transition={{ duration:5+i*2, delay:i*1.5, repeat:Infinity, ease:"linear" }}
            className="absolute text-xl opacity-30" style={{ bottom:`${20+i*12}%` }}>{f}</motion.div>
        ))}

        {(phase==="casting"||phase==="waiting"||phase==="reeling") && (
          <div className="absolute top-6 flex flex-col items-center">
            <div className="text-4xl">🎣</div>
            <motion.div animate={{ height:phase==="casting"?[0,120]:phase==="reeling"?[120,0]:[120] }}
              transition={{ duration:0.8 }} className="w-0.5 origin-top" style={{ background:"rgba(255,255,255,0.25)" }} />
            {(phase==="waiting"||phase==="reeling") && (
              <motion.div animate={{ y:phase==="waiting"?[0,7,0]:undefined }} transition={{ duration:0.7, repeat:phase==="waiting"?Infinity:0 }} className="text-lg">🪝</motion.div>
            )}
          </div>
        )}

        <div className="mt-24 text-center px-4">
          {phase==="idle"&&<p className="text-slate-400">Cast your line to start fishing!</p>}
          {phase==="casting"&&<motion.p animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:0.5, repeat:Infinity }} className="text-blue-400">Casting line…</motion.p>}
          {phase==="waiting"&&<motion.p animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:1, repeat:Infinity }} className="text-cyan-400">Waiting for a bite… 🎣</motion.p>}
          {phase==="reeling"&&<motion.p animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:0.3, repeat:Infinity }} className="text-yellow-400">Reeling in! 💪</motion.p>}
        </div>

        <AnimatePresence>
          {phase==="done"&&catch_&&(
            <motion.div initial={{ scale:0, rotate:-10 }} animate={{ scale:1, rotate:0 }} exit={{ scale:0 }}
              transition={{ type:"spring", stiffness:280 }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl"
              style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(12px)", border:`2px solid ${color}`, boxShadow:`0 0 30px ${color}44` }}>
              <motion.div animate={{ rotate:[0,10,-10,0] }} transition={{ duration:0.5, delay:0.2 }} className="text-6xl">{catch_.emoji}</motion.div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color }}>{catch_.rarity}</p>
                <p className="text-xl font-bold text-white">{catch_.name}</p>
                {catch_.value > 0
                  ? <p className="text-lg font-black mt-1 text-green-400">+🍪{fmt(net>0?net:0)} profit</p>
                  : <p className="text-slate-400 text-sm mt-1">Just junk… -🍪{fmt(bet)}</p>}
              </div>
              {hasRod&&<span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(59,130,246,0.2)", color:"#60a5fa" }}>🎣 Enchanted Rod Active</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={phase!=="idle"&&phase!=="done"} />
        <button onClick={phase==="done"?()=>setPhase("idle"):cast} disabled={(phase!=="idle"&&phase!=="done")||balance<bet} className="btn-primary w-full py-3">
          {phase==="idle"?"🎣 Cast Line":phase==="done"?"🎣 Cast Again":"🎣 Fishing…"}
        </button>
      </div>
    </div>
  );
}
