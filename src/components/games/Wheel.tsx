
"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";

type Risk = "low"|"medium"|"high";
const SEGS: Record<Risk,{s:string,m:number,c:string}[]> = {
  low:[{s:"0.5×",m:0.5,c:"#ef4444"},{s:"1×",m:1,c:"#64748b"},{s:"1.5×",m:1.5,c:"#3b82f6"},{s:"2×",m:2,c:"#10b981"},{s:"3×",m:3,c:"#f59e0b"},{s:"1×",m:1,c:"#64748b"},{s:"1.5×",m:1.5,c:"#3b82f6"},{s:"5×",m:5,c:"#a855f7"}],
  medium:[{s:"0×",m:0,c:"#ef4444"},{s:"1.5×",m:1.5,c:"#3b82f6"},{s:"0×",m:0,c:"#ef4444"},{s:"2×",m:2,c:"#10b981"},{s:"3×",m:3,c:"#f59e0b"},{s:"1.5×",m:1.5,c:"#3b82f6"},{s:"5×",m:5,c:"#a855f7"},{s:"20×",m:20,c:"#f59e0b"}],
  high:[{s:"0×",m:0,c:"#ef4444"},{s:"0×",m:0,c:"#ef4444"},{s:"2×",m:2,c:"#10b981"},{s:"0×",m:0,c:"#ef4444"},{s:"10×",m:10,c:"#f59e0b"},{s:"0×",m:0,c:"#ef4444"},{s:"50×",m:50,c:"#a855f7"},{s:"100×",m:100,c:"#f59e0b"}],
};

export function Wheel({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [bet,setBet] = useState(100);
  const [risk,setRisk] = useState<Risk>("medium");
  const [spinning,setSpinning] = useState(false);
  const [angle,setAngle] = useState(0);
  const [result,setResult] = useState<{segment:string,mult:number,net:number}|null>(null);

  const segs = SEGS[risk];
  const segAngle = 360/segs.length;

  const spin = async () => {
    if (spinning) return;
    setSpinning(true); setResult(null);
    const res = await fetch("/api/games/simple",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game:"wheel",bet,risk})});
    const d = await res.json();
    const spinTo = 1440+Math.random()*360;
    setAngle(a=>a+spinTo);
    setTimeout(()=>{
      if (!d.error) { setResult({segment:d.result.segment,mult:d.result.mult,net:d.net}); onBalanceChange(d.newBalance); }
      setSpinning(false);
    },2500);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 p-4"
        style={{background:"rgba(8,8,15,0.6)",border:"1px solid rgba(139,92,246,0.15)"}}>

        {/* Pointer */}
        <div className="text-2xl" style={{filter:"drop-shadow(0 4px 8px rgba(245,158,11,0.8))"}}>▼</div>

        {/* Wheel */}
        <div className="relative w-48 h-48 md:w-64 md:h-64" style={{perspective:"800px"}}>
          <motion.div animate={{rotate:angle}} transition={{duration:2.5,ease:[0.17,0.67,0.35,1]}}
            className="w-full h-full rounded-full relative overflow-hidden"
            style={{border:"4px solid rgba(255,255,255,0.15)",boxShadow:"0 0 40px rgba(139,92,246,0.3)"}}>
            {segs.map((seg,i)=>(
              <div key={i} className="absolute inset-0 flex items-center justify-end pr-4"
                style={{transform:`rotate(${i*segAngle}deg)`,transformOrigin:"50% 50%",clipPath:`polygon(50% 50%, 100% ${50-Math.tan((segAngle/2)*Math.PI/180)*50}%, 100% ${50+Math.tan((segAngle/2)*Math.PI/180)*50}%)`}}>
                <div className="absolute inset-0" style={{background:seg.c,opacity:0.8}} />
                <span className="relative z-10 text-white font-black text-sm" style={{transform:`rotate(${segAngle/2}deg)`}}>
                  {seg.s}
                </span>
              </div>
            ))}
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-white" style={{boxShadow:"0 0 15px rgba(255,255,255,0.8)"}} />
          </div>
        </div>

        <AnimatePresence>
          {result && !spinning && (
            <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
              className="px-6 py-3 rounded-xl text-center"
              style={{background:result.mult>0?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.1)",border:`1px solid ${result.mult>0?"rgba(16,185,129,0.4)":"rgba(239,68,68,0.3)"}`}}>
              <p className="text-xl font-black" style={{color:result.mult>0?"#34d399":"#f87171"}}>
                {result.segment} {result.net>0?`+🍪${fmt(result.net)}`:result.net<0?`-🍪${fmt(-result.net)}`:"Break even"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          {(["low","medium","high"] as Risk[]).map(r=>(
            <button key={r} onClick={()=>{setRisk(r);setResult(null);}} disabled={spinning}
              className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{background:risk===r?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.04)",border:"1px solid",borderColor:risk===r?"rgba(139,92,246,0.4)":"rgba(255,255,255,0.08)",color:risk===r?"#a78bfa":"#64748b"}}>
              {r}
            </button>
          ))}
        </div>
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={spinning} />
        <button onClick={spin} disabled={spinning||balance<bet} className="btn-primary w-full py-3">
          {spinning?"Spinning…":"🎡 Spin"}
        </button>
      </div>
    </div>
  );
}
