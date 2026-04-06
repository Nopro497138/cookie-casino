
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";
import { playSFX } from "@/lib/sfx";

type Phase = "betting" | "playing" | "done";

export function Mines({ balance, onBalanceChange }: { balance:number; onBalanceChange:(n:number)=>void }) {
  const [bet, setBet] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [phase, setPhase] = useState<Phase>("betting");
  const [gameState, setGameState] = useState<Record<string,unknown>|null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<number[]>([]);
  const [nextMult, setNextMult] = useState(1);
  const [status, setStatus] = useState("");
  const [win, setWin] = useState(0);
  const [loading, setLoading] = useState(false);

  const post = (body: object) => fetch("/api/games/mines", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r=>r.json());

  const start = async () => {
    setLoading(true);
    const d = await post({ action:"start", bet, mineCount });
    if (d.error) { setLoading(false); return; }
    playSFX("click", 0.3);
    setGameState({ minePositions:d.minePositions, revealed:[], bet:d.bet, mineCount:d.mineCount });
    setRevealed([]); setMines([]); setNextMult(d.nextMult); setStatus(""); setWin(0);
    setPhase("playing"); setLoading(false);
  };

  const reveal = async (idx: number) => {
    if (!gameState || loading || revealed.includes(idx) || mines.includes(idx)) return;
    setLoading(true);
    const d = await post({ action:"reveal", cellIndex:idx, gameState:{ ...gameState, revealed } });
    setLoading(false);
    if (d.status === "dead") {
      playSFX("mine_explode", 0.6);
      setMines(gameState.minePositions as number[]);
      setRevealed([...revealed, idx]);
      setStatus("dead"); setPhase("done");
      onBalanceChange(d.newBalance);
    } else if (d.status === "playing" || d.status === "complete") {
      playSFX("mine_reveal", 0.3);
      setRevealed(d.revealed);
      if (d.status === "complete") { setMines(gameState.minePositions as number[]); setWin(d.win); setStatus("win"); setPhase("done"); onBalanceChange(d.newBalance); playSFX("win", 0.5); }
      else setNextMult(d.nextMult ?? nextMult);
    }
  };

  const cashout = async () => {
    if (!gameState || loading) return;
    setLoading(true);
    const d = await post({ action:"cashout", gameState:{ ...gameState, revealed } });
    setLoading(false);
    if (d.status === "cashout" || d.status === "refund") {
      playSFX("mine_cashout", 0.5);
      setMines(gameState.minePositions as number[]); setWin(d.win ?? 0); setStatus("win"); setPhase("done");
      onBalanceChange(d.newBalance);
    }
  };

  const currentMult = gameState ? (() => {
    const r = revealed.length, m = (gameState.mineCount as number) ?? 3;
    if (r===0) return 1;
    let mult=1; for(let i=0;i<r;i++) mult*=(25-m-i)/(25-i);
    return parseFloat((0.99/mult).toFixed(3));
  })() : 1;

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 flex items-center justify-center p-2">
        <div className="grid gap-1.5 w-full" style={{ gridTemplateColumns:"repeat(5,1fr)", maxWidth:"340px" }}>
          {Array.from({ length:25 }, (_,i) => {
            const isRevealed = revealed.includes(i);
            const isMine = mines.includes(i);
            return (
              <motion.button key={i}
                whileHover={phase==="playing"&&!isRevealed?{ scale:1.08, y:-2 }:{}}
                whileTap={phase==="playing"&&!isRevealed?{ scale:0.94 }:{}}
                onClick={() => phase==="playing" && reveal(i)}
                disabled={phase!=="playing"||isRevealed||loading}
                className="aspect-square rounded-xl flex items-center justify-center text-xl transition-all"
                style={{
                  background: isMine?"rgba(239,68,68,0.28)":isRevealed?"rgba(16,185,129,0.18)":"rgba(255,255,255,0.05)",
                  border:"1px solid", borderColor:isMine?"rgba(239,68,68,0.5)":isRevealed?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.07)",
                  boxShadow:isRevealed?"0 0 12px rgba(16,185,129,0.2)":isMine?"0 0 12px rgba(239,68,68,0.3)":"none",
                  cursor:phase==="playing"&&!isRevealed?"pointer":"default",
                }}>
                <AnimatePresence>
                  {isRevealed&&!isMine && <motion.span key="gem" initial={{ scale:0 }} animate={{ scale:1 }}>💎</motion.span>}
                  {isMine && <motion.span key="mine" initial={{ scale:0 }} animate={{ scale:1 }}>💣</motion.span>}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        {phase==="betting" && (
          <>
            <BetInput bet={bet} onChange={setBet} balance={balance} disabled={loading} />
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-wide">Mines: {mineCount}</label>
              <input type="range" min={1} max={24} value={mineCount} onChange={e=>setMineCount(+e.target.value)} className="w-full accent-purple-500" />
              <div className="flex justify-between text-xs text-slate-600"><span>1 (Safe)</span><span>24 (Risky)</span></div>
            </div>
            <button onClick={start} disabled={loading||balance<bet} className="btn-primary w-full py-3">{loading?"Starting…":"Start Game"}</button>
          </>
        )}
        {phase==="playing" && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-400">Multiplier</p>
              <p className="text-2xl font-black" style={{ color:"#f59e0b" }}>{currentMult}×</p>
              <p className="text-xs text-slate-500">Next: {nextMult}×</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-slate-400">Potential</p>
              <p className="text-lg font-bold text-green-400">🍪{fmt(Math.floor(bet*currentMult))}</p>
            </div>
            <button onClick={cashout} disabled={loading||revealed.length===0}
              className="px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-40"
              style={{ background:"rgba(16,185,129,0.2)", border:"1px solid rgba(16,185,129,0.4)", color:"#34d399" }}>
              Cash Out
            </button>
          </div>
        )}
        {phase==="done" && (
          <div className="flex items-center justify-between">
            {status==="win"
              ? <p className="text-green-400 font-bold">🎉 Won 🍪{fmt(win)}</p>
              : <p className="text-red-400 font-bold">💣 Kaboom! Lost 🍪{fmt(bet)}</p>}
            <button onClick={()=>{ setPhase("betting"); setRevealed([]); setMines([]); setGameState(null); }} className="btn-primary px-4 py-2">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
