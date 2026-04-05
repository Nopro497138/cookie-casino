
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";

export function Keno({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [bet,setBet] = useState(100);
  const [picks,setPicks] = useState<number[]>([]);
  const [drawn,setDrawn] = useState<number[]>([]);
  const [matches,setMatches] = useState(0);
  const [mult,setMult] = useState(0);
  const [loading,setLoading] = useState(false);
  const [done,setDone] = useState(false);

  const toggle = (n: number) => {
    if (done) return;
    setPicks(p=>p.includes(n)?p.filter(x=>x!==n):p.length<10?[...p,n]:p);
  };

  const play = async () => {
    if (picks.length<1||loading) return;
    setLoading(true); setDone(false); setDrawn([]); setMatches(0);
    const res = await fetch("/api/games/simple",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game:"keno",bet,picks})});
    const d = await res.json();
    if (!d.error) {
      // Reveal drawn numbers one by one
      const drawnNums: number[] = d.result.drawn;
      for (let i=0;i<drawnNums.length;i++) {
        await new Promise(r=>setTimeout(r,60));
        setDrawn(prev=>[...prev,drawnNums[i]]);
      }
      setMatches(d.result.matches);
      setMult(d.result.mult);
      onBalanceChange(d.newBalance);
      setDone(true);
    }
    setLoading(false);
  };

  const reset = () => { setPicks([]); setDrawn([]); setMatches(0); setMult(0); setDone(false); };

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      {/* Grid */}
      <div className="flex-1 rounded-2xl p-3 md:p-4 overflow-auto"
        style={{background:"rgba(8,8,15,0.6)",border:"1px solid rgba(139,92,246,0.15)"}}>
        <div className="grid gap-1 mb-3" style={{gridTemplateColumns:"repeat(10,1fr)"}}>
          {Array.from({length:80},(_,i)=>{
            const n=i+1;
            const isPick=picks.includes(n);
            const isDrawn=drawn.includes(n);
            const isMatch=isPick&&isDrawn;
            return (
              <motion.button key={n} onClick={()=>toggle(n)} disabled={loading}
                whileHover={!loading&&!done?{scale:1.1}:{}}
                animate={isDrawn?{scale:[1,1.15,1]}:{}}
                className="aspect-square rounded-md text-xs font-bold flex items-center justify-center transition-all"
                style={{
                  background:isMatch?"rgba(16,185,129,0.4)":isPick?"rgba(139,92,246,0.3)":isDrawn?"rgba(245,158,11,0.2)":"rgba(255,255,255,0.04)",
                  border:"1px solid",
                  borderColor:isMatch?"rgba(16,185,129,0.7)":isPick?"rgba(139,92,246,0.5)":isDrawn?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.07)",
                  color:isMatch?"#34d399":isPick?"#a78bfa":isDrawn?"#fbbf24":"#64748b",
                  boxShadow:isMatch?"0 0 10px rgba(16,185,129,0.4)":isPick?"0 0 8px rgba(139,92,246,0.3)":"none",
                  fontSize:"0.65rem",
                }}>
                {n}
              </motion.button>
            );
          })}
        </div>

        {done && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            className="p-3 rounded-xl text-center"
            style={{background:mult>0?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${mult>0?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`}}>
            <p className="font-bold" style={{color:mult>0?"#34d399":"#f87171"}}>
              {matches}/{picks.length} matches — {mult>0?`${mult}× = +🍪${fmt(Math.floor(bet*mult)-bet)}`:`-🍪${fmt(bet)}`}
            </p>
          </motion.div>
        )}
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Picks: <span className="font-bold text-white">{picks.length}/10</span></span>
          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear</button>
        </div>
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={loading} />
        <button onClick={done?reset:play} disabled={(!done&&(picks.length<1||loading||balance<bet))}
          className="btn-primary w-full py-3">
          {loading?"Drawing…":done?"Play Again":"Draw Numbers"}
        </button>
      </div>
    </div>
  );
}
