
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface DepositModalProps { open: boolean; onClose: () => void; onSuccess: (usd: number) => void; }

const PRESET_USD = [1, 5, 10, 25, 50, 100];

export function DepositModal({ open, onClose, onSuccess }: DepositModalProps) {
  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);

  const deposit = async () => {
    setLoading(true);
    const res = await fetch("/api/deposit", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ amountUSD: amount }) });
    const d = await res.json();
    setLoading(false);
    if (d.success) {
      toast.success(`Deposited $${amount} → 🍪${(amount * 1_000_000).toLocaleString()}`, { duration: 5000 });
      onSuccess(amount);
      onClose();
    } else toast.error(d.error ?? "Deposit failed");
  };

  const COOKIES_PER_USD = 1_000_000;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          onClick={e=>e.target===e.currentTarget&&onClose()}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", zIndex:200 }}>
          <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }}
            className="w-full max-w-sm glass rounded-3xl p-6"
            style={{ border:"1px solid rgba(16,185,129,0.3)", boxShadow:"0 0 60px rgba(16,185,129,0.15)" }}>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">💵 Deposit</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
            </div>

            <div className="p-3 rounded-xl mb-4 text-sm text-center" style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)" }}>
              <p className="text-green-400 font-bold">$1 = 🍪1,000,000 cookies</p>
              <p className="text-slate-400 text-xs mt-0.5">USD balance is used in the Shop</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {PRESET_USD.map(v => (
                <button key={v} onClick={() => setAmount(v)}
                  className="py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: amount===v?"rgba(16,185,129,0.25)":"rgba(255,255,255,0.05)", border:"1px solid", borderColor: amount===v?"rgba(16,185,129,0.5)":"rgba(255,255,255,0.08)", color: amount===v?"#34d399":"#94a3b8" }}>
                  ${v}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-green-400 font-bold">$</span>
              <input type="number" value={amount} min={1} max={100} onChange={e=>setAmount(Math.min(100,Math.max(1,+e.target.value||1)))}
                className="flex-1 bg-transparent text-white font-bold outline-none" />
            </div>

            <p className="text-center text-slate-400 text-xs mb-4">
              You will receive <span className="text-yellow-400 font-bold">🍪{(amount * COOKIES_PER_USD).toLocaleString()}</span> USD balance
            </p>

            <div className="p-3 rounded-xl mb-4 text-xs text-slate-400" style={{ background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.15)" }}>
              ⚠️ <strong className="text-yellow-400">Demo mode:</strong> This is a simulated deposit. In production, Stripe would process real payments. No actual money is charged.
            </div>

            <button onClick={deposit} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
              style={{ background:"linear-gradient(135deg,#10b981,#059669)", boxShadow:"0 0 20px rgba(16,185,129,0.3)" }}>
              {loading ? "Processing…" : `Deposit $${amount}`}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
