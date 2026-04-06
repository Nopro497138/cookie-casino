
"use client";
import { fmt } from "@/lib/utils";

interface BetInputProps {
  bet: number;
  onChange: (v: number) => void;
  balance: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const QUICK = [10, 50, 100, 500, 1000];

export function BetInput({bet, onChange, balance, min=10, max=50000, disabled=false}: BetInputProps) {
  const set = (v: number) => onChange(Math.min(Math.max(Math.floor(v), min), Math.min(max, balance)));
  return (
    <div className="space-y-2">
      <label className="text-xs text-slate-400 uppercase tracking-wide">Bet Amount</label>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
          <span className="text-base">🍪</span>
          <input type="number" value={bet} onChange={e=>set(Number(e.target.value))} disabled={disabled} min={min} max={Math.min(max,balance)}
            className="flex-1 bg-transparent text-white font-bold text-sm outline-none" style={{appearance:"textfield"}} />
        </div>
        <button onClick={()=>set(balance)} disabled={disabled}
          className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style={{background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",color:"#f59e0b"}}>
          MAX
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {QUICK.filter(q=>q<=balance).map(q => (
          <button key={q} onClick={()=>set(q)} disabled={disabled}
            className="px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:scale-105"
            style={{background:bet===q?"rgba(139,92,246,0.3)":"rgba(255,255,255,0.05)",border:"1px solid",borderColor:bet===q?"rgba(139,92,246,0.5)":"rgba(255,255,255,0.08)",color:bet===q?"#a78bfa":"#94a3b8"}}>
            {fmt(q)}
          </button>
        ))}
        <button onClick={()=>set(bet/2)} disabled={disabled||bet<=min}
          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:scale-105"
          style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>
          ½
        </button>
        <button onClick={()=>set(bet*2)} disabled={disabled||bet*2>balance}
          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all hover:scale-105"
          style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#94a3b8"}}>
          2×
        </button>
      </div>
    </div>
  );
}
