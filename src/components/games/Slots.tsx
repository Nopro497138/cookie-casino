
"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";

const ALL_SYMBOLS = ["🍪","🍪","🍪","⭐","⭐","💎","🎰","🔔","🍒","🍋"];

export function Slots({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [bet,setBet] = useState(100);
  const [spinning,setSpinning] = useState(false);
  const [reels,setReels] = useState(["🍪","⭐","🔔","💎","🍒"]);
  const [result,setResult] = useState<{mult:number,won:boolean}|null>(null);
  const [animReels,setAnimReels] = useState([false,false,false,false,false]);

  const spin = async () => {
    if (spinning) return;
    setSpinning(true); setResult(null);
    setAnimReels([true,true,true,true,true]);
    const res = await fetch("/api/games/simple",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game:"slots",bet})});
    const d = await res.json();
    if (!d.error) {
      // Reveal reels one by one
      const final: string[] = d.result.reels;
      for (let i=0;i<5;i++) {
        await new Promise(r=>setTimeout(r,300));
        setReels(prev=>{const n=[...prev];n[i]=final[i];return n;});
        setAnimReels(prev=>{const n=[...prev];n[i]=false;return n;});
      }
      setResult({mult:d.result.mult,won:d.won});
      onBalanceChange(d.newBalance);
    }
    setSpinning(false);
  };

  const counts: Record<string,number> = {};
  reels.forEach(s=>counts[s]=(counts[s]||0)+1);
  const maxCount = Math.max(...Object.values(counts),0);
  const topSym = Object.entries(counts).find(([,v])=>v===maxCount)?.[0];

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-8 p-6"
        style={{background:"linear-gradient(135deg,rgba(88,28,135,0.3),rgba(30,27,75,0.6))",border:"1px solid rgba(139,92,246,0.3)",
          boxShadow:result?.won?"0 0 60px rgba(245,158,11,0.3)":"0 0 20px rgba(139,92,246,0.1)"}}>

        {/* Machine top */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{background:"#ef4444",boxShadow:"0 0 8px #ef4444"}} />
          <div className="w-3 h-3 rounded-full animate-pulse" style={{background:"#f59e0b",boxShadow:"0 0 8px #f59e0b",animationDelay:"0.3s"}} />
          <div className="w-3 h-3 rounded-full animate-pulse" style={{background:"#10b981",boxShadow:"0 0 8px #10b981",animationDelay:"0.6s"}} />
        </div>

        {/* Reels */}
        <div className="flex gap-2 md:gap-3 p-4 rounded-2xl" style={{background:"rgba(0,0,0,0.5)",border:"2px solid rgba(245,158,11,0.3)"}}>
          {reels.map((sym,i)=>(
            <div key={i} className="w-12 h-14 md:w-16 md:h-20 overflow-hidden rounded-xl flex items-center justify-center relative"
              style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
              {animReels[i] ? (
                <motion.div animate={{y:["-100%","0%","-100%"]}} transition={{duration:0.15,repeat:Infinity}}
                  className="text-3xl md:text-4xl select-none">
                  {ALL_SYMBOLS[Math.floor(Math.random()*ALL_SYMBOLS.length)]}
                </motion.div>
              ) : (
                <motion.div key={sym} initial={{y:-40,opacity:0}} animate={{y:0,opacity:1}} transition={{type:"spring",stiffness:200}}
                  className="text-3xl md:text-4xl select-none"
                  style={result?.won&&sym===topSym&&maxCount>=3?{filter:"drop-shadow(0 0 8px gold)"}:{}}>
                  {sym}
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
              className="text-center px-6 py-3 rounded-xl"
              style={{background:result.won?"rgba(245,158,11,0.15)":"rgba(239,68,68,0.1)",border:`1px solid ${result.won?"rgba(245,158,11,0.4)":"rgba(239,68,68,0.3)"}`}}>
              {result.won ? (
                <p className="text-xl font-black" style={{color:"#f59e0b"}}>🎰 {result.mult}× — +🍪{fmt(Math.floor(bet*result.mult)-bet)}</p>
              ) : (
                <p className="text-lg font-semibold text-red-400">No match this time</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Paytable */}
      <div className="glass rounded-xl p-3">
        <p className="text-xs text-slate-500 mb-2 text-center uppercase tracking-wide">Paytable (5 reels)</p>
        <div className="flex gap-3 justify-center flex-wrap text-xs">
          {[["💎","50×"],["🎰","30×"],["⭐","15×"],["🔔","10×"],["🍪","8×"]].map(([s,m])=>(
            <span key={s} className="flex items-center gap-1 text-slate-400"><span>{s}×5</span><span className="text-yellow-500 font-bold">{m}</span></span>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={spinning} />
        <button onClick={spin} disabled={spinning||balance<bet} className="btn-primary w-full py-3 text-lg font-black">
          {spinning ? "Spinning…" : "🎰 SPIN"}
        </button>
      </div>
    </div>
  );
}
