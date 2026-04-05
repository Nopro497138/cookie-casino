
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";

export function Dice({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [bet,setBet] = useState(100);
  const [target,setTarget] = useState(50);
  const [over,setOver] = useState(true);
  const [roll,setRoll] = useState<number|null>(null);
  const [won,setWon] = useState<boolean|null>(null);
  const [loading,setLoading] = useState(false);
  const [rolling,setRolling] = useState(false);

  const winChance = over ? (100-target)/100 : target/100;
  const mult = parseFloat(((1/winChance)*0.95).toFixed(4));
  const payout = Math.floor(bet*mult);

  const play = async () => {
    setLoading(true); setRolling(true); setRoll(null);
    await new Promise(r=>setTimeout(r,600));
    const res = await fetch("/api/games/simple",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game:"dice",bet,target,over})});
    const d = await res.json();
    setRolling(false);
    if (!d.error) { setRoll(d.result.roll); setWon(d.result.won); onBalanceChange(d.newBalance); }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      {/* Display */}
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-6 p-6"
        style={{background:"rgba(8,8,15,0.6)",border:"1px solid rgba(139,92,246,0.15)",
          boxShadow:won===true?"0 0 40px rgba(16,185,129,0.2)":won===false?"0 0 40px rgba(239,68,68,0.2)":"none"}}>

        {/* Big number display */}
        <AnimatePresence mode="wait">
          {rolling ? (
            <motion.div key="rolling" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-8xl font-black text-slate-600 tabular-nums animate-pulse">
              ?
            </motion.div>
          ) : roll !== null ? (
            <motion.div key={roll} initial={{scale:0.5,opacity:0,rotate:-10}} animate={{scale:1,opacity:1,rotate:0}} transition={{type:"spring",stiffness:300}}
              className="text-8xl font-black tabular-nums"
              style={{color:won?"#10b981":"#ef4444", textShadow:`0 0 40px ${won?"rgba(16,185,129,0.6)":"rgba(239,68,68,0.6)"}`}}>
              {roll}
            </motion.div>
          ) : (
            <motion.div key="idle" className="text-8xl font-black text-slate-700 tabular-nums">?</motion.div>
          )}
        </AnimatePresence>

        {/* Win condition */}
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span>Roll</span>
          <button onClick={()=>setOver(false)}
            className="px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{background:!over?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.04)",border:"1px solid",borderColor:!over?"rgba(139,92,246,0.5)":"rgba(255,255,255,0.08)",color:!over?"#a78bfa":"#64748b"}}>
            Under
          </button>
          <span className="text-2xl font-black text-white">{target}</span>
          <button onClick={()=>setOver(true)}
            className="px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{background:over?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.04)",border:"1px solid",borderColor:over?"rgba(139,92,246,0.5)":"rgba(255,255,255,0.08)",color:over?"#a78bfa":"#64748b"}}>
            Over
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs h-3 rounded-full relative overflow-hidden" style={{background:"rgba(255,255,255,0.05)"}}>
          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{width:`${target}%`,background:"linear-gradient(90deg,rgba(239,68,68,0.6),rgba(139,92,246,0.6))"}} />
          <div className="absolute inset-y-0 rounded-full w-0.5" style={{left:`${target}%`,background:"white",boxShadow:"0 0 8px white"}} />
          {roll!==null && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}}
              className="absolute inset-y-0 w-2 rounded-full"
              style={{left:`${roll}%`,translateX:"-50%",background:won?"#10b981":"#ef4444",boxShadow:`0 0 12px ${won?"rgba(16,185,129,0.8)":"rgba(239,68,68,0.8)"}`}} />
          )}
        </div>

        <input type="range" min={2} max={98} value={target} onChange={e=>setTarget(+e.target.value)} disabled={loading}
          className="w-full max-w-xs accent-purple-500" />

        {/* Stats */}
        <div className="flex gap-6 text-center">
          {[{l:"Win Chance",v:`${(winChance*100).toFixed(2)}%`},{l:"Multiplier",v:`${mult}×`},{l:"Payout",v:`🍪${fmt(payout)}`}].map(({l,v})=>(
            <div key={l}><p className="text-xs text-slate-500">{l}</p><p className="text-sm font-bold text-white">{v}</p></div>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={loading} />
        <button onClick={play} disabled={loading||balance<bet} className="btn-primary w-full py-3">
          {loading?"Rolling…":"Roll Dice 🎲"}
        </button>
      </div>
    </div>
  );
}
