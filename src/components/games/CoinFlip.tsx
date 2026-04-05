
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";

export function CoinFlip({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [bet,setBet] = useState(100);
  const [choice,setChoice] = useState<"heads"|"tails">("heads");
  const [flipping,setFlipping] = useState(false);
  const [result,setResult] = useState<{flip:string,won:boolean}|null>(null);

  const flip = async () => {
    if (flipping) return;
    setFlipping(true); setResult(null);
    await new Promise(r=>setTimeout(r,900));
    const res = await fetch("/api/games/simple",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game:"coinflip",bet,choice})});
    const d = await res.json();
    if (!d.error) { setResult(d.result); onBalanceChange(d.newBalance); }
    setFlipping(false);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-8"
        style={{background:"rgba(8,8,15,0.6)",border:"1px solid rgba(139,92,246,0.15)"}}>

        {/* Coin */}
        <div className="relative" style={{perspective:"600px"}}>
          <motion.div
            animate={flipping?{rotateY:[0,900,1800],scale:[1,1.2,1]}:result?{rotateY:result.flip==="heads"?0:180}:{rotateY:0}}
            transition={flipping?{duration:0.9,ease:"easeInOut"}:{duration:0.3}}
            className="w-32 h-32 rounded-full flex items-center justify-center text-6xl font-black select-none"
            style={{
              background:flipping?"linear-gradient(135deg,#f59e0b,#d97706)":result?.flip==="heads"?"linear-gradient(135deg,#f59e0b,#fbbf24)":"linear-gradient(135deg,#6366f1,#4f46e5)",
              boxShadow:flipping?"0 0 40px rgba(245,158,11,0.7)":result?.won?"0 0 40px rgba(16,185,129,0.6)":"0 0 20px rgba(139,92,246,0.4)",
              border:"3px solid rgba(255,255,255,0.1)",
              transformStyle:"preserve-3d",
            }}>
            {flipping ? "🌀" : result?.flip==="heads" ? "👑" : "🦅"}
          </motion.div>
        </div>

        <AnimatePresence>
          {result && !flipping && (
            <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
              className="text-center">
              <p className="text-2xl font-black" style={{color:result.won?"#10b981":"#ef4444"}}>
                {result.won ? "🎉 You Won!" : "💔 You Lost"}
              </p>
              <p className="text-lg font-bold" style={{color:result.won?"#34d399":"#f87171"}}>
                {result.won?`+🍪${fmt(bet)}`:`-🍪${fmt(bet)}`}
              </p>
              <p className="text-slate-400 text-sm capitalize">Result: {result.flip}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex gap-3">
          {(["heads","tails"] as const).map(c=>(
            <button key={c} onClick={()=>setChoice(c)} disabled={flipping}
              className="flex-1 py-3 rounded-xl font-bold capitalize text-lg transition-all"
              style={{background:choice===c?"rgba(139,92,246,0.25)":"rgba(255,255,255,0.04)",border:`1px solid ${choice===c?"rgba(139,92,246,0.5)":"rgba(255,255,255,0.08)"}`,color:choice===c?"#a78bfa":"#64748b"}}>
              {c==="heads"?"👑":"🦅"} {c}
            </button>
          ))}
        </div>
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={flipping} />
        <button onClick={flip} disabled={flipping||balance<bet} className="btn-primary w-full py-3">
          {flipping?"Flipping…":"Flip Coin 🪙"}
        </button>
      </div>
    </div>
  );
}
