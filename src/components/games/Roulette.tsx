
"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";
import { playSFX } from "@/lib/sfx";

type BetType = "red"|"black"|"even"|"odd"|"1-18"|"19-36"|"1st12"|"2nd12"|"3rd12";

// EXACT same red set as server
const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const getNumColor = (n: number) => n===0?"#059669":RED_NUMBERS.has(n)?"#ef4444":"#1f2937";
const getNumText = (n: number) => n===0?"green":RED_NUMBERS.has(n)?"red":"black";

const BET_OPTIONS: { id: string; label: string; mult: number; color: string }[] = [
  {id:"red",    label:"Red",    mult:2, color:"#ef4444"},
  {id:"black",  label:"Black",  mult:2, color:"#374151"},
  {id:"even",   label:"Even",   mult:2, color:"#6366f1"},
  {id:"odd",    label:"Odd",    mult:2, color:"#8b5cf6"},
  {id:"1-18",   label:"1–18",   mult:2, color:"#0891b2"},
  {id:"19-36",  label:"19–36",  mult:2, color:"#0e7490"},
  {id:"1st12",  label:"1st 12", mult:3, color:"#059669"},
  {id:"2nd12",  label:"2nd 12", mult:3, color:"#047857"},
  {id:"3rd12",  label:"3rd 12", mult:3, color:"#065f46"},
];

export function Roulette({ balance, onBalanceChange }: { balance: number; onBalanceChange: (n: number) => void }) {
  const [bet, setBet] = useState(100);
  const [betType, setBetType] = useState<string>("red");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ n: number; color: string; won: boolean; mult: number; net: number } | null>(null);
  const [wheelDeg, setWheelDeg] = useState(0);
  const [ballDeg, setBallDeg] = useState(0);
  const totalRef = useRef(0);

  const spin = async () => {
    if (spinning) return;
    setSpinning(true); setResult(null);
    playSFX("roulette_spin", 0.5);

    const res = await fetch("/api/games/simple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "roulette", bet, betType }),
    });
    const d = await res.json();
    if (d.error) { setSpinning(false); return; }

    const serverResult = d.result as { n: number; color: string; won: boolean; mult: number };

    // Spin animation — wheel goes clockwise, ball counter-clockwise
    const spinAmt = 1440 + Math.random() * 720;
    totalRef.current += spinAmt;
    setWheelDeg(totalRef.current);
    setBallDeg(deg => deg - spinAmt * 1.4);

    setTimeout(() => {
      playSFX("roulette_land", 0.4);
      setResult({ ...serverResult, net: d.net });
      onBalanceChange(d.newBalance);
      setSpinning(false);
    }, 2400);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 p-4"
        style={{ background: "linear-gradient(135deg,rgba(5,78,58,0.4),rgba(8,8,15,0.9))", border: "1px solid rgba(16,185,129,0.2)" }}>

        {/* Wheel */}
        <div className="relative w-40 h-40 md:w-52 md:h-52">
          {/* Pointer */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-yellow-400 text-xl leading-none"
            style={{ filter: "drop-shadow(0 2px 6px rgba(245,158,11,0.8))" }}>▼</div>

          {/* Wheel body — 37 pockets: 0 (green) + 18 red + 18 black */}
          <motion.div animate={{ rotate: wheelDeg }} transition={{ duration: 2.4, ease: [0.17, 0.67, 0.35, 1] }}
            className="w-full h-full rounded-full border-4"
            style={{
              borderColor: "rgba(245,158,11,0.6)",
              boxShadow: "0 0 30px rgba(245,158,11,0.3)",
              background: "conic-gradient(from 0deg," +
                Array.from({ length: 37 }, (_, i) => {
                  const deg = (i / 37) * 360;
                  const next = ((i + 1) / 37) * 360;
                  const n = i === 0 ? 0 : i;
                  const col = n === 0 ? "#059669" : RED_NUMBERS.has(n) ? "#b91c1c" : "#111827";
                  return `${col} ${deg.toFixed(1)}deg ${next.toFixed(1)}deg`;
                }).join(",") + ")",
            }} />

          {/* Ball */}
          <motion.div animate={{ rotate: ballDeg }} transition={{ duration: 2.4, ease: [0.17, 0.67, 0.35, 1] }}
            className="absolute inset-0 flex items-start justify-center pointer-events-none" style={{ paddingTop: "4px" }}>
            <div className="w-3 h-3 rounded-full bg-white" style={{ boxShadow: "0 0 10px white, 0 0 20px rgba(255,255,255,0.5)" }} />
          </motion.div>

          {/* Center hub */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full z-10"
              style={{ background: "#0a0a14", border: "2px solid rgba(245,158,11,0.5)", boxShadow: "0 0 12px rgba(245,158,11,0.3)" }} />
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && !spinning && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl"
              style={{ background: "rgba(0,0,0,0.6)", border: `2px solid ${getNumColor(result.n)}`, boxShadow: `0 0 20px ${getNumColor(result.n)}66` }}>
              <span className="text-3xl font-black w-10 text-center" style={{ color: getNumColor(result.n) }}>{result.n}</span>
              <span className="font-semibold capitalize text-sm" style={{ color: getNumColor(result.n) }}>{getNumText(result.n)}</span>
              <span className="font-bold text-sm ml-2" style={{ color: result.won ? "#34d399" : "#f87171" }}>
                {result.won ? `+🍪${fmt(result.net)}` : `-🍪${fmt(-result.net)}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet board */}
        <div className="grid grid-cols-3 gap-1.5 w-full max-w-xs">
          {BET_OPTIONS.map(b => (
            <button key={b.id} onClick={() => setBetType(b.id)} disabled={spinning}
              className="py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: betType === b.id ? `${b.color}44` : "rgba(255,255,255,0.04)",
                border: `1px solid ${betType === b.id ? b.color : "rgba(255,255,255,0.08)"}`,
                color: betType === b.id ? "white" : "#94a3b8",
                boxShadow: betType === b.id ? `0 0 12px ${b.color}66` : "none",
              }}>
              {b.label} <span className="opacity-60">({b.mult}×)</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={spinning} />
        <button onClick={spin} disabled={spinning || balance < bet} className="btn-primary w-full py-3">
          {spinning ? "Spinning…" : "🎡 Spin the Wheel"}
        </button>
      </div>
    </div>
  );
}
