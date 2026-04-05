
"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";

type Risk = "low"|"medium"|"high";

const MULTS: Record<Risk,number[]> = {
  low:   [1.5,1.2,1.1,1.0,0.5,1.0,1.1,1.2,1.5],
  medium:[3,1.5,1.2,0.5,0.3,0.5,1.2,1.5,3],
  high:  [100,10,3,1,0.5,1,3,10,100],
};
const MULT_COLORS: Record<Risk,string[]> = {
  low:["#10b981","#10b981","#3b82f6","#6366f1","#8b5cf6","#6366f1","#3b82f6","#10b981","#10b981"],
  medium:["#f59e0b","#10b981","#3b82f6","#6366f1","#8b5cf6","#6366f1","#3b82f6","#10b981","#f59e0b"],
  high:["#f59e0b","#ef4444","#10b981","#3b82f6","#8b5cf6","#3b82f6","#10b981","#ef4444","#f59e0b"],
};

export function Plinko({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [bet,setBet] = useState(100);
  const [risk,setRisk] = useState<Risk>("medium");
  const [loading,setLoading] = useState(false);
  const [activeBucket,setActiveBucket] = useState<number|null>(null);
  const [result,setResult] = useState<{mult:number,win:number,won:boolean}|null>(null);
  const [ballPath,setBallPath] = useState<("L"|"R")[]>([]);
  const [ballActive,setBallActive] = useState(false);

  const drop = async () => {
    if (loading) return;
    setLoading(true); setResult(null); setActiveBucket(null); setBallActive(false);
    const r = await fetch("/api/games/plinko",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bet,risk})});
    const d = await r.json();
    if (!d.error) {
      setBallPath(d.path);
      setBallActive(true);
      setTimeout(()=>{
        setActiveBucket(d.bucketIndex);
        setResult({mult:d.mult,win:d.win,won:d.won});
        onBalanceChange(d.newBalance);
        setLoading(false); setBallActive(false);
      }, 1500);
    } else setLoading(false);
  };

  const rows = 12;
  const mults = MULTS[risk];
  const colors = MULT_COLORS[risk];

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      {/* Board */}
      <div className="flex-1 rounded-2xl p-4 relative overflow-hidden" style={{background:"rgba(8,8,15,0.6)",border:"1px solid rgba(139,92,246,0.15)"}}>
        {/* Pins */}
        <div className="flex flex-col items-center gap-2 mb-3">
          {Array.from({length:rows},(_,row)=>(
            <div key={row} className="flex gap-3" style={{paddingLeft:`${(rows-1-row)*10}px`,paddingRight:`${(rows-1-row)*10}px`}}>
              {Array.from({length:row+2},(_,col)=>(
                <div key={col} className="w-2 h-2 rounded-full" style={{background:"rgba(139,92,246,0.6)",boxShadow:"0 0 6px rgba(139,92,246,0.4)"}} />
              ))}
            </div>
          ))}
        </div>

        {/* Ball animation */}
        {ballActive && (
          <motion.div className="absolute text-2xl pointer-events-none" style={{top:"8px",left:"50%",translateX:"-50%",zIndex:10}}
            animate={{y:["0%","90%"],x:[0,...ballPath.map((d,i)=>d==="R"?(i+1)*4:-(i+1)*4)]}}
            transition={{duration:1.3,ease:"easeIn"}}>
            🔴
          </motion.div>
        )}

        {/* Buckets */}
        <div className="flex gap-1 mt-1">
          {mults.map((m,i) => (
            <motion.div key={i} animate={activeBucket===i?{scale:[1,1.2,1],y:[0,-6,0]}:{}}
              className="flex-1 rounded-lg py-2 text-center text-xs font-black transition-all duration-300"
              style={{
                background:activeBucket===i?`${colors[i]}33`:"rgba(255,255,255,0.04)",
                border:"1px solid",
                borderColor:activeBucket===i?colors[i]:"rgba(255,255,255,0.08)",
                color:activeBucket===i?colors[i]:colors[i]+"99",
                boxShadow:activeBucket===i?`0 0 20px ${colors[i]}66`:"none",
                fontSize:"0.6rem",
              }}>
              {m}×
            </motion.div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          {(["low","medium","high"] as Risk[]).map(r=>(
            <button key={r} onClick={()=>setRisk(r)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{background:risk===r?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.04)",border:"1px solid",borderColor:risk===r?"rgba(139,92,246,0.4)":"rgba(255,255,255,0.08)",color:risk===r?"#a78bfa":"#64748b"}}>
              {r}
            </button>
          ))}
        </div>
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={loading} />
        {result && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            className="px-4 py-2 rounded-lg text-center"
            style={{background:result.won?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${result.won?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`}}>
            <span className="font-bold" style={{color:result.won?"#34d399":"#f87171"}}>
              {result.mult}× → {result.won?"+":"-"}🍪{fmt(Math.abs(result.win-bet))}
            </span>
          </motion.div>
        )}
        <button onClick={drop} disabled={loading||balance<bet} className="btn-primary w-full py-3">
          {loading ? "Dropping…" : "Drop Ball 🔴"}
        </button>
      </div>
    </div>
  );
}
