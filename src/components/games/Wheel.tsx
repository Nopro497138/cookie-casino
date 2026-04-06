
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";
import { playSFX } from "@/lib/sfx";

type Risk = "low" | "medium" | "high";

// These are DISPLAY-ONLY segments on the wheel.
// The actual payout comes 100% from the server.
const DISPLAY_SEGS: Record<Risk, { label: string; color: string }[]> = {
  low: [
    { label: "0×",   color: "#ef4444" },
    { label: "0.5×", color: "#f97316" },
    { label: "1×",   color: "#64748b" },
    { label: "1.2×", color: "#3b82f6" },
    { label: "1.5×", color: "#10b981" },
    { label: "2×",   color: "#a855f7" },
    { label: "3×",   color: "#f59e0b" },
    { label: "5×",   color: "#ec4899" },
  ],
  medium: [
    { label: "0×",   color: "#ef4444" },
    { label: "0×",   color: "#ef4444" },
    { label: "0.5×", color: "#f97316" },
    { label: "1×",   color: "#64748b" },
    { label: "1.5×", color: "#3b82f6" },
    { label: "2×",   color: "#10b981" },
    { label: "3×",   color: "#a855f7" },
    { label: "5×",   color: "#f59e0b" },
    { label: "10×",  color: "#ec4899" },
    { label: "25×",  color: "#fbbf24" },
  ],
  high: [
    { label: "0×",   color: "#ef4444" },
    { label: "0×",   color: "#ef4444" },
    { label: "0×",   color: "#ef4444" },
    { label: "0×",   color: "#ef4444" },
    { label: "2×",   color: "#10b981" },
    { label: "5×",   color: "#3b82f6" },
    { label: "10×",  color: "#a855f7" },
    { label: "25×",  color: "#f59e0b" },
    { label: "50×",  color: "#ec4899" },
    { label: "100×", color: "#fbbf24" },
  ],
};

export function Wheel({ balance, onBalanceChange }: { balance: number; onBalanceChange: (n: number) => void }) {
  const [bet, setBet] = useState(100);
  const [risk, setRisk] = useState<Risk>("medium");
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState<{ segment: string; mult: number; net: number } | null>(null);

  const segs = DISPLAY_SEGS[risk];
  const segDeg = 360 / segs.length;

  const spin = async () => {
    if (spinning) return;
    setSpinning(true); setResult(null);
    playSFX("wheel_spin", 0.5);

    const res = await fetch("/api/games/simple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "wheel", bet, risk }),
    });
    const d = await res.json();

    // Spin animation — purely cosmetic, result comes from server
    const spinTo = 1440 + Math.random() * 1440;
    setAngle(a => a + spinTo);

    setTimeout(() => {
      if (!d.error) {
        playSFX("wheel_land", 0.4);
        setResult({ segment: d.result.segment, mult: d.result.mult, net: d.net });
        onBalanceChange(d.newBalance);
      }
      setSpinning(false);
    }, 2600);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 p-4"
        style={{ background: "rgba(8,8,15,0.6)", border: "1px solid rgba(139,92,246,0.15)" }}>

        {/* Pointer */}
        <div className="text-yellow-400 text-2xl leading-none" style={{ filter: "drop-shadow(0 4px 8px rgba(245,158,11,0.8))" }}>▼</div>

        {/* Wheel */}
        <div className="relative w-52 h-52 md:w-64 md:h-64">
          <motion.svg animate={{ rotate: angle }} transition={{ duration: 2.6, ease: [0.17, 0.67, 0.35, 1] }}
            viewBox="-1 -1 2 2" className="w-full h-full"
            style={{ border: "4px solid rgba(245,158,11,0.4)", borderRadius: "50%", boxShadow: "0 0 40px rgba(139,92,246,0.3)" }}>
            {segs.map((seg, i) => {
              const startAngle = (i * segDeg - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * segDeg - 90) * (Math.PI / 180);
              const x1 = Math.cos(startAngle), y1 = Math.sin(startAngle);
              const x2 = Math.cos(endAngle), y2 = Math.sin(endAngle);
              const midAngle = ((i + 0.5) * segDeg - 90) * (Math.PI / 180);
              const tx = Math.cos(midAngle) * 0.65, ty = Math.sin(midAngle) * 0.65;
              return (
                <g key={i}>
                  <path d={`M 0 0 L ${x1} ${y1} A 1 1 0 0 1 ${x2} ${y2} Z`} fill={seg.color} stroke="rgba(0,0,0,0.3)" strokeWidth="0.02" />
                  <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                    fontSize="0.13" fontWeight="bold" fill="white"
                    transform={`rotate(${(i + 0.5) * segDeg + 90}, ${tx}, ${ty})`}>
                    {seg.label}
                  </text>
                </g>
              );
            })}
            <circle cx="0" cy="0" r="0.08" fill="#0a0a14" stroke="rgba(245,158,11,0.6)" strokeWidth="0.03" />
          </motion.svg>
        </div>

        {/* Result — shows SERVER result, not wheel display */}
        <AnimatePresence>
          {result && !spinning && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}
              className="px-6 py-3 rounded-xl text-center"
              style={{ background: result.mult > 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)", border: `1px solid ${result.mult > 0 ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.3)"}` }}>
              <p className="text-2xl font-black" style={{ color: result.mult > 0 ? "#34d399" : "#f87171" }}>
                {result.segment} {result.net > 0 ? `+🍪${fmt(result.net)}` : result.net < 0 ? `-🍪${fmt(-result.net)}` : "Break even"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          {(["low", "medium", "high"] as Risk[]).map(r => (
            <button key={r} onClick={() => { setRisk(r); setResult(null); }} disabled={spinning}
              className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{ background: risk === r ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)", border: "1px solid", borderColor: risk === r ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)", color: risk === r ? "#a78bfa" : "#64748b" }}>
              {r}
            </button>
          ))}
        </div>
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={spinning} />
        <button onClick={spin} disabled={spinning || balance < bet} className="btn-primary w-full py-3">
          {spinning ? "Spinning…" : "☸️ Spin"}
        </button>
      </div>
    </div>
  );
}
