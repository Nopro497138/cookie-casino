
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";

type BetType = "red"|"black"|"even"|"odd"|"1-18"|"19-36"|"1st12"|"2nd12"|"3rd12";
const RED_NUMS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BETS: {id:BetType|string,label:string,mult:number,color:string}[] = [
  {id:"red",label:"Red",mult:2,color:"#ef4444"},{id:"black",label:"Black",mult:2,color:"#374151"},
  {id:"even",label:"Even",mult:2,color:"#6366f1"},{id:"odd",label:"Odd",mult:2,color:"#8b5cf6"},
  {id:"1-18",label:"1-18",mult:2,color:"#0891b2"},{id:"19-36",label:"19-36",mult:2,color:"#0e7490"},
  {id:"1st12",label:"1st 12",mult:3,color:"#059669"},{id:"2nd12",label:"2nd 12",mult:3,color:"#047857"},{id:"3rd12",label:"3rd 12",mult:3,color:"#065f46"},
];

export function Roulette({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [bet,setBet] = useState(100);
  const [betType,setBetType] = useState<string>("red");
  const [spinning,setSpinning] = useState(false);
  const [result,setResult] = useState<{n:number,color:string,won:boolean,mult:number}|null>(null);
  const [ballAngle,setBallAngle] = useState(0);
  const [wheelAngle,setWheelAngle] = useState(0);

  const spin = async () => {
    if (spinning) return;
    setSpinning(true); setResult(null);
    const spinDeg = 720+Math.random()*1440;
    setWheelAngle(a=>a+spinDeg);
    setBallAngle(a=>a-spinDeg*1.3);
    const res = await fetch("/api/games/simple",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game:"roulette",bet,betType})});
    const d = await res.json();
    setTimeout(()=>{
      if (!d.error) { setResult(d.result); onBalanceChange(d.newBalance); }
      setSpinning(false);
    },2200);
  };

  const getNumColor = (n: number) => n===0?"#059669":RED_NUMS.includes(n)?"#ef4444":"#1f2937";

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 p-4"
        style={{background:"linear-gradient(135deg,rgba(5,78,58,0.4),rgba(8,8,15,0.9))",border:"1px solid rgba(16,185,129,0.2)"}}>

        {/* Wheel */}
        <div className="relative w-36 h-36 md:w-48 md:h-48">
          <motion.div animate={{rotate:wheelAngle}} transition={{duration:2.2,ease:[0.17,0.67,0.35,1]}}
            className="w-full h-full rounded-full flex items-center justify-center text-4xl"
            style={{background:"conic-gradient(from 0deg, #ef4444 0% 10%, #1f2937 10% 20%, #ef4444 20% 30%, #1f2937 30% 40%, #ef4444 40% 50%, #1f2937 50% 60%, #ef4444 60% 70%, #1f2937 70% 80%, #059669 80% 84%, #ef4444 84% 92%, #1f2937 92% 100%)",
              border:"4px solid rgba(245,158,11,0.6)",boxShadow:"0 0 30px rgba(245,158,11,0.3)"}}>
          </motion.div>
          {/* Ball */}
          <motion.div animate={{rotate:ballAngle}} transition={{duration:2.2,ease:[0.17,0.67,0.35,1]}}
            className="absolute inset-0 flex items-start justify-center pt-1 pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-white shadow-lg" style={{boxShadow:"0 0 8px white"}} />
          </motion.div>
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full" style={{background:"#111827",border:"2px solid rgba(245,158,11,0.5)"}} />
          </div>
        </div>

        {/* Result number */}
        <AnimatePresence>
          {result && !spinning && (
            <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl"
              style={{background:"rgba(0,0,0,0.5)",border:`2px solid ${getNumColor(result.n)}`}}>
              <span className="text-3xl font-black" style={{color:getNumColor(result.n),textShadow:`0 0 20px ${getNumColor(result.n)}`}}>
                {result.n}
              </span>
              <span className="font-semibold capitalize" style={{color:getNumColor(result.n)}}>{result.color}</span>
              {result.won
                ? <span className="text-green-400 font-bold">+🍪{fmt(Math.floor(bet*result.mult)-bet)}</span>
                : <span className="text-red-400 font-bold">-🍪{fmt(bet)}</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet board */}
        <div className="grid grid-cols-3 gap-1.5 w-full max-w-xs md:max-w-sm">
          {BETS.map(b=>(
            <button key={b.id} onClick={()=>setBetType(b.id)} disabled={spinning}
              className="py-2 rounded-lg text-xs font-semibold transition-all"
              style={{background:betType===b.id?`${b.color}44`:"rgba(255,255,255,0.04)",border:`1px solid ${betType===b.id?b.color:"rgba(255,255,255,0.08)"}`,color:betType===b.id?"white":"#94a3b8",boxShadow:betType===b.id?`0 0 12px ${b.color}66`:"none"}}>
              {b.label} <span className="opacity-70">({b.mult}×)</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={spinning} />
        <button onClick={spin} disabled={spinning||balance<bet} className="btn-primary w-full py-3">
          {spinning?"Spinning…":"🎡 Spin the Wheel"}
        </button>
      </div>
    </div>
  );
}
