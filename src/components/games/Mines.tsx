
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";

type Phase = "betting"|"playing"|"done";

export function Mines({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [bet,setBet] = useState(100);
  const [mineCount,setMineCount] = useState(3);
  const [phase,setPhase] = useState<Phase>("betting");
  const [gameState,setGameState] = useState<Record<string,unknown>|null>(null);
  const [revealed,setRevealed] = useState<number[]>([]);
  const [mines,setMines] = useState<number[]>([]);
  const [nextMult,setNextMult] = useState(1);
  const [status,setStatus] = useState<string>("");
  const [win,setWin] = useState(0);
  const [loading,setLoading] = useState(false);

  const post = async (body: object) => {
    const r = await fetch("/api/games/mines",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    return r.json();
  };

  const start = async () => {
    setLoading(true);
    const d = await post({action:"start",bet,mineCount});
    if (d.error) { setLoading(false); return; }
    setGameState({minePositions:d.minePositions,revealed:[],bet:d.bet,mineCount:d.mineCount});
    setRevealed([]); setMines([]); setNextMult(d.nextMult); setStatus(""); setWin(0);
    setPhase("playing"); setLoading(false);
  };

  const reveal = async (idx: number) => {
    if (!gameState||loading||revealed.includes(idx)||mines.includes(idx)) return;
    setLoading(true);
    const d = await post({action:"reveal",cellIndex:idx,gameState:{...gameState,revealed}});
    setLoading(false);
    if (d.status==="dead") {
      setMines(gameState.minePositions as number[]);
      setRevealed(d.revealed||[...revealed,idx]);
      setStatus("dead"); setPhase("done");
      onBalanceChange(d.newBalance);
    } else if (d.status==="complete"||d.status==="playing") {
      setRevealed(d.revealed);
      if (d.status==="complete") { setMines(gameState.minePositions as number[]); setWin(d.win); setStatus("win"); setPhase("done"); onBalanceChange(d.newBalance); }
      else setNextMult(d.nextMult||nextMult);
    }
  };

  const cashout = async () => {
    if (!gameState||loading) return;
    setLoading(true);
    const d = await post({action:"cashout",gameState:{...gameState,revealed}});
    setLoading(false);
    if (d.status==="cashout"||d.status==="refund") {
      setMines(gameState.minePositions as number[]);
      setWin(d.win||0); setStatus("win"); setPhase("done");
      onBalanceChange(d.newBalance);
    }
  };

  const currentMult = gameState ? (() => {
    const r = revealed.length, m = (gameState.mineCount as number)||3;
    if(r===0) return 1;
    let mult=1; for(let i=0;i<r;i++) mult*=(25-m-i)/(25-i);
    return parseFloat((0.99/mult).toFixed(3));
  })() : 1;

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      {/* Grid */}
      <div className="flex-1 flex items-center justify-center p-2">
        <div className="grid gap-1.5 md:gap-2" style={{gridTemplateColumns:"repeat(5,1fr)",maxWidth:"360px",width:"100%"}}>
          {Array.from({length:25},(_,i)=>{
            const isRevealed = revealed.includes(i);
            const isMine = mines.includes(i);
            const isHit = isMine && status==="dead" && !isRevealed && i===mines.find(m=>!revealed.includes(m));
            return (
              <motion.button key={i}
                whileHover={phase==="playing"&&!isRevealed?{scale:1.08,y:-2}:{}}
                whileTap={phase==="playing"&&!isRevealed?{scale:0.95}:{}}
                onClick={()=>phase==="playing"&&reveal(i)}
                disabled={phase!=="playing"||isRevealed||loading}
                className="aspect-square rounded-xl flex items-center justify-center text-xl transition-all duration-200"
                style={{
                  background: isMine?"rgba(239,68,68,0.3)":isRevealed?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.05)",
                  border:"1px solid",
                  borderColor: isMine?"rgba(239,68,68,0.5)":isRevealed?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.08)",
                  boxShadow: isRevealed?"0 0 12px rgba(16,185,129,0.2)":isMine?"0 0 12px rgba(239,68,68,0.3)":"none",
                  cursor: phase==="playing"&&!isRevealed?"pointer":"default",
                }}>
                <AnimatePresence>
                  {isRevealed&&!isMine && <motion.span initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} key="gem">💎</motion.span>}
                  {isMine && <motion.span initial={{scale:0}} animate={{scale:1}} key="mine">💣</motion.span>}
                  {phase==="playing"&&!isRevealed&&!isMine && <span className="opacity-0">·</span>}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="glass rounded-xl p-4 space-y-3">
        {phase==="betting" && (
          <>
            <BetInput bet={bet} onChange={setBet} balance={balance} disabled={loading} />
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 uppercase tracking-wide">Mines: {mineCount}</label>
              <input type="range" min={1} max={24} value={mineCount} onChange={e=>setMineCount(+e.target.value)}
                className="w-full accent-purple-500" />
              <div className="flex justify-between text-xs text-slate-500"><span>1 (Safe)</span><span>24 (Risky)</span></div>
            </div>
            <button onClick={start} disabled={loading||balance<bet} className="btn-primary w-full py-3">
              {loading?"Starting…":"Start Game"}
            </button>
          </>
        )}
        {phase==="playing" && (
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400">Current Multiplier</p>
              <p className="text-2xl font-black" style={{color:"#f59e0b"}}>{currentMult}×</p>
              <p className="text-xs text-slate-500">Next: {nextMult}×</p>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-xs text-slate-400">Potential Win</p>
              <p className="text-lg font-bold text-green-400">🍪{fmt(Math.floor(bet*currentMult))}</p>
            </div>
            <button onClick={cashout} disabled={loading||revealed.length===0}
              className="px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-40"
              style={{background:"rgba(16,185,129,0.2)",border:"1px solid rgba(16,185,129,0.4)",color:"#34d399"}}>
              Cash Out
            </button>
          </div>
        )}
        {phase==="done" && (
          <div className="flex items-center justify-between">
            <div>
              {status==="win"
                ? <p className="text-green-400 font-bold text-lg">🎉 Won 🍪{fmt(win)}</p>
                : <p className="text-red-400 font-bold text-lg">💣 Kaboom! Lost 🍪{fmt(bet)}</p>}
            </div>
            <button onClick={()=>{setPhase("betting");setRevealed([]);setMines([]);setGameState(null);}} className="btn-primary">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
