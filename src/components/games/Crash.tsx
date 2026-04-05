
"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";

export function Crash({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [bet,setBet] = useState(100);
  const [autoCash,setAutoCash] = useState(2.0);
  const [phase,setPhase] = useState<"idle"|"flying"|"crashed">("idle");
  const [mult,setMult] = useState(1.00);
  const [crashAt,setCrashAt] = useState(0);
  const [cashedOut,setCashedOut] = useState(false);
  const [result,setResult] = useState<{won:boolean,at:number,net:number}|null>(null);
  const intervalRef = useRef<NodeJS.Timeout|null>(null);
  const multRef = useRef(1.00);

  const startRound = async () => {
    setPhase("flying"); setMult(1.00); multRef.current=1.00; setCashedOut(false); setResult(null);
    const res = await fetch("/api/games/simple",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game:"crash",bet,cashOutAt:autoCash})});
    const d = await res.json();
    if (d.error) { setPhase("idle"); return; }
    const actualCrash: number = d.result.cp;

    intervalRef.current = setInterval(()=>{
      multRef.current = parseFloat((multRef.current + 0.01 + multRef.current*0.003).toFixed(2));
      setMult(multRef.current);
      if (multRef.current >= autoCash && !cashedOut) {
        clearInterval(intervalRef.current!);
        setCashedOut(true);
        const won = autoCash <= actualCrash;
        const net = won ? Math.floor(bet*autoCash)-bet : -bet;
        setResult({won,at:autoCash,net});
        onBalanceChange(d.newBalance);
        setTimeout(()=>{setPhase("crashed");setCrashAt(actualCrash);},300);
      }
      if (multRef.current >= actualCrash) {
        clearInterval(intervalRef.current!);
        if (!cashedOut) {
          setResult({won:false,at:actualCrash,net:-bet});
          onBalanceChange(d.newBalance);
        }
        setPhase("crashed"); setCrashAt(actualCrash);
      }
    }, 60);
  };

  const cashOutNow = async () => {
    if (phase!=="flying"||cashedOut) return;
    clearInterval(intervalRef.current!);
    const at = multRef.current;
    const res = await fetch("/api/games/simple",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game:"crash",bet,cashOutAt:at})});
    const d = await res.json();
    setCashedOut(true);
    setResult({won:d.result.won,at,net:d.net});
    onBalanceChange(d.newBalance);
    setTimeout(()=>setPhase("crashed"),500);
  };

  useEffect(()=>()=>{clearInterval(intervalRef.current!);},[]);

  const multColor = mult < 1.5 ? "#10b981" : mult < 2 ? "#f59e0b" : mult < 5 ? "#f97316" : "#ef4444";

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 p-6 relative overflow-hidden"
        style={{background:"linear-gradient(180deg,rgba(8,8,15,0.9),rgba(30,8,8,0.6))",border:`1px solid ${phase==="crashed"?"rgba(239,68,68,0.4)":"rgba(139,92,246,0.2)"}`}}>

        {/* Rocket */}
        {phase==="flying" && (
          <motion.div animate={{y:[0,-10,0],rotate:[-3,3,-3]}} transition={{duration:0.6,repeat:Infinity}}
            className="text-5xl absolute top-6 right-8" style={{filter:"drop-shadow(0 0 20px rgba(245,158,11,0.8))"}}>
            🚀
          </motion.div>
        )}
        {phase==="crashed" && (
          <motion.div initial={{scale:0}} animate={{scale:[0,1.5,1]}} className="text-5xl absolute top-6 right-8">💥</motion.div>
        )}

        {/* Multiplier */}
        <motion.div key={phase} initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}}
          className="text-7xl md:text-8xl font-black tabular-nums"
          style={{color:phase==="crashed"&&!cashedOut?"#ef4444":cashedOut?"#10b981":multColor,
            textShadow:`0 0 40px ${phase==="crashed"&&!cashedOut?"rgba(239,68,68,0.7)":cashedOut?"rgba(16,185,129,0.7)":`${multColor}99`}`}}>
          {phase==="crashed" && !cashedOut ? `${crashAt}×` : `${mult.toFixed(2)}×`}
        </motion.div>

        <p className="text-slate-500 text-sm">
          {phase==="idle"?"Set your auto cash-out and start":phase==="flying"?"🚀 Flying — cash out before it crashes!":"💥 Crashed!"}
        </p>

        {result && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
            className="px-6 py-3 rounded-xl text-center"
            style={{background:result.won?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.1)",border:`1px solid ${result.won?"rgba(16,185,129,0.4)":"rgba(239,68,68,0.3)"}`}}>
            {result.won
              ? <p className="text-green-400 font-bold text-lg">✅ Cashed out at {result.at}× — +🍪{fmt(result.net)}</p>
              : <p className="text-red-400 font-bold text-lg">💥 Crashed at {result.at}× — -🍪{fmt(bet)}</p>}
          </motion.div>
        )}
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        {phase==="idle"||phase==="crashed" ? (
          <>
            <BetInput bet={bet} onChange={setBet} balance={balance} disabled={phase==="flying"} />
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400 whitespace-nowrap">Auto Cash-out at</label>
              <input type="number" value={autoCash} step={0.1} min={1.1} max={1000}
                onChange={e=>setAutoCash(parseFloat(e.target.value)||2)}
                className="w-24 bg-transparent border rounded-lg px-2 py-1.5 text-sm font-bold text-center outline-none"
                style={{borderColor:"rgba(139,92,246,0.3)",color:"#a78bfa"}} />
              <span className="text-purple-400 font-bold">×</span>
            </div>
            <button onClick={startRound} disabled={balance<bet} className="btn-primary w-full py-3">
              🚀 Start
            </button>
          </>
        ) : (
          <button onClick={cashOutNow} disabled={cashedOut}
            className="w-full py-3 rounded-xl font-black text-xl transition-all hover:scale-105 disabled:opacity-50"
            style={{background:"linear-gradient(135deg,#10b981,#059669)",boxShadow:"0 0 30px rgba(16,185,129,0.5)"}}>
            {cashedOut ? `✅ Cashed at ${result?.at}×` : `💸 Cash Out (${mult.toFixed(2)}×)`}
          </button>
        )}
      </div>
    </div>
  );
}
