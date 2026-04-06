
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";
import { playSFX } from "@/lib/sfx";

type Risk = "low" | "medium" | "high";

const ROWS = 12;
const MULTS: Record<Risk, number[]> = {
  low:    [5.6, 2.1, 1.1, 1.0, 0.5, 0.3, 0.5, 1.0, 1.1, 2.1, 5.6],
  medium: [13,  3,   1.3, 0.7, 0.4, 0.2, 0.4, 0.7, 1.3, 3,   13 ],
  high:   [110, 41,  10,  5,   3,   0.5, 3,   5,   10,  41,  110],
};
const MULT_COLORS: Record<Risk, string[]> = {
  low:    ["#f59e0b","#10b981","#3b82f6","#6366f1","#8b5cf6","#ef4444","#8b5cf6","#6366f1","#3b82f6","#10b981","#f59e0b"],
  medium: ["#f59e0b","#10b981","#3b82f6","#6366f1","#8b5cf6","#ef4444","#8b5cf6","#6366f1","#3b82f6","#10b981","#f59e0b"],
  high:   ["#f59e0b","#f59e0b","#ef4444","#10b981","#3b82f6","#8b5cf6","#3b82f6","#10b981","#ef4444","#f59e0b","#f59e0b"],
};

interface Ball { x: number; y: number; vx: number; vy: number; done: boolean; bucketIdx: number; }

export function Plinko({ balance, onBalanceChange }: { balance: number; onBalanceChange: (n: number) => void }) {
  const [bet, setBet] = useState(100);
  const [risk, setRisk] = useState<Risk>("medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ mult: number; net: number; won: boolean } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const ballRef = useRef<Ball | null>(null);
  const resultRef = useRef<typeof result>(null);

  const BOARD_W = 320;
  const BOARD_H = 380;
  const PIN_R = 4;
  const BALL_R = 7;

  // Pin positions
  const pins: { x: number; y: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    const count = row + 2;
    const startX = BOARD_W / 2 - (count - 1) * (BOARD_W / (ROWS + 2)) / 2;
    const spacing = (BOARD_W / (ROWS + 2));
    const y = 30 + row * (BOARD_H - 80) / ROWS;
    for (let col = 0; col < count; col++) {
      pins.push({ x: startX + col * spacing, y });
    }
  }

  const bucketCount = MULTS[risk].length;
  const bucketW = BOARD_W / bucketCount;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);

    // Background
    ctx.fillStyle = "rgba(8,8,15,0.0)";
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    // Pins
    pins.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, PIN_R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(139,92,246,0.8)";
      ctx.shadowColor = "rgba(139,92,246,0.6)";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Buckets
    const mults = MULTS[risk];
    const colors = MULT_COLORS[risk];
    for (let i = 0; i < bucketCount; i++) {
      const x = i * bucketW;
      const y = BOARD_H - 30;
      const isActive = ballRef.current?.done && ballRef.current.bucketIdx === i;
      ctx.fillStyle = isActive ? colors[i] + "cc" : colors[i] + "33";
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x + 1, y, bucketW - 2, 26, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isActive ? "#fff" : colors[i];
      ctx.font = `bold ${bucketW > 30 ? 9 : 7}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`${mults[i]}×`, x + bucketW / 2, y + 17);
    }

    // Ball
    const ball = ballRef.current;
    if (ball) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_R);
      grad.addColorStop(0, "#fff");
      grad.addColorStop(1, "#f59e0b");
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(245,158,11,0.8)";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [risk, pins, bucketCount, bucketW]);

  const animate = useCallback(() => {
    const ball = ballRef.current;
    if (!ball || ball.done) {
      draw();
      return;
    }

    // Physics
    ball.vy += 0.35; // gravity
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Pin collision
    for (const pin of pins) {
      const dx = ball.x - pin.x;
      const dy = ball.y - pin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PIN_R + BALL_R) {
        playSFX("plinko_bounce", 0.15);
        const nx = dx / dist, ny = dy / dist;
        const overlap = PIN_R + BALL_R - dist;
        ball.x += nx * overlap;
        ball.y += ny * overlap;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx = (ball.vx - 2 * dot * nx) * 0.6 + (Math.random() - 0.5) * 1.5;
        ball.vy = (ball.vy - 2 * dot * ny) * 0.6;
        if (ball.vy < 0) ball.vy = Math.abs(ball.vy) * 0.5;
      }
    }

    // Wall bounce
    if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx) * 0.7; }
    if (ball.x > BOARD_W - BALL_R) { ball.x = BOARD_W - BALL_R; ball.vx = -Math.abs(ball.vx) * 0.7; }

    // Reached bottom
    if (ball.y >= BOARD_H - 30 - BALL_R) {
      ball.done = true;
      ball.bucketIdx = Math.min(Math.floor(ball.x / bucketW), bucketCount - 1);
      playSFX("plinko_land", 0.4);
      setResult(resultRef.current);
      setLoading(false);
    }

    draw();
    animRef.current = requestAnimationFrame(animate);
  }, [pins, draw, bucketCount, bucketW]);

  useEffect(() => () => cancelAnimationFrame(animRef.current!), []);

  const drop = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    ballRef.current = null;
    draw();

    const res = await fetch("/api/games/plinko", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bet, risk }),
    });
    const d = await res.json();
    if (d.error) { setLoading(false); return; }

    onBalanceChange(d.newBalance);
    resultRef.current = { mult: d.mult, net: d.net, won: d.won };
    playSFX("plinko_drop", 0.5);

    // Start ball at top center with tiny random offset
    ballRef.current = {
      x: BOARD_W / 2 + (Math.random() - 0.5) * 4,
      y: 8,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 1,
      done: false,
      bucketIdx: d.bucketIndex,
    };
    animRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl flex flex-col items-center justify-center p-4"
        style={{ background: "rgba(8,8,15,0.7)", border: "1px solid rgba(139,92,246,0.15)" }}>
        <canvas ref={canvasRef} width={BOARD_W} height={BOARD_H}
          style={{ maxWidth: "100%", maxHeight: "100%" }} />
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-3 px-5 py-2 rounded-xl text-center"
              style={{ background: result.won ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)", border: `1px solid ${result.won ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.3)"}` }}>
              <span className="font-bold" style={{ color: result.won ? "#34d399" : "#f87171" }}>
                {result.mult}× — {result.net > 0 ? `+🍪${fmt(result.net)}` : `-🍪${fmt(-result.net)}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          {(["low", "medium", "high"] as Risk[]).map(r => (
            <button key={r} onClick={() => { setRisk(r); setResult(null); }} disabled={loading}
              className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{ background: risk === r ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)", border: "1px solid", borderColor: risk === r ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)", color: risk === r ? "#a78bfa" : "#64748b" }}>
              {r}
            </button>
          ))}
        </div>
        <BetInput bet={bet} onChange={setBet} balance={balance} disabled={loading} />
        <button onClick={drop} disabled={loading || balance < bet} className="btn-primary w-full py-3">
          {loading ? "Dropping…" : "Drop Ball 🔴"}
        </button>
      </div>
    </div>
  );
}
