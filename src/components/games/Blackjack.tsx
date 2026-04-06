
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetInput } from "@/components/ui/BetInput";
import { fmt } from "@/lib/utils";
import { playSFX } from "@/lib/sfx";

type Card = { suit: string; value: string; numeric: number };
type Phase = "betting" | "playing" | "done";
const SUIT_COLOR: Record<string, string> = { "♥":"#ef4444","♦":"#ef4444","♠":"#e2e8f0","♣":"#e2e8f0" };

function PlayingCard({ card, hidden, delay=0 }: { card:Card; hidden?:boolean; delay?:number }) {
  return (
    <motion.div initial={{ x:-60, rotate:-8, opacity:0 }} animate={{ x:0, rotate:0, opacity:1 }} transition={{ delay, duration:0.3, type:"spring" }}
      className="card-playing shrink-0"
      style={hidden
        ? { background:"linear-gradient(135deg,#312e81,#1e1b4b)", color:"transparent" }
        : { background:"linear-gradient(135deg,#1e293b,#0f172a)", color:SUIT_COLOR[card.suit]??"#e2e8f0", border:"1px solid rgba(255,255,255,0.12)" }}>
      {!hidden && <><div className="text-xs leading-none font-black">{card.value}</div><div className="text-xl leading-none">{card.suit}</div></>}
      {hidden && <div className="text-2xl">🃏</div>}
    </motion.div>
  );
}

function Hand({ cards, score, label, isDealer }: { cards:Card[]; score:number; label:string; isDealer?:boolean }) {
  const bust = score > 21;
  const bj = score === 21 && cards.length === 2;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background:bust?"rgba(239,68,68,0.2)":bj?"rgba(245,158,11,0.2)":"rgba(139,92,246,0.15)", color:bust?"#f87171":bj?"#fbbf24":"#a78bfa" }}>
          {bust ? "BUST" : bj ? "BLACKJACK!" : score || ""}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap min-h-[90px] items-start">
        {cards.map((c, i) => <PlayingCard key={i} card={c} delay={i * 0.1} hidden={isDealer && i===1 && score===0} />)}
      </div>
    </div>
  );
}

export function Blackjack({ balance, onBalanceChange }: { balance:number; onBalanceChange:(n:number)=>void }) {
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState<Phase>("betting");
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [hidden, setHidden] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [pScore, setPScore] = useState(0);
  const [dScore, setDScore] = useState(0);
  const [result, setResult] = useState<{ status:string; net?:number }|null>(null);
  const [loading, setLoading] = useState(false);

  const post = (body: object) => fetch("/api/games/blackjack", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r=>r.json());

  const deal = async () => {
    setLoading(true); setResult(null);
    playSFX("card_deal", 0.4);
    const d = await post({ action:"deal", bet });
    if (d.error) { setLoading(false); return; }
    setPlayer(d.player); setDealer(d.dealer ?? [d.dealer?.[0]]); setHidden(d.hiddenDealer ?? []);
    setPScore(d.playerScore); setDScore(d.dealerScore ?? 0); setDeck(d.deck ?? []);
    if (d.status === "blackjack") {
      playSFX("blackjack_win", 0.6);
      setDealer(d.dealer); setDScore(d.dealerScore);
      setResult({ status:"blackjack", net:d.win });
      onBalanceChange(d.newBalance); setPhase("done");
    } else setPhase("playing");
    setLoading(false);
  };

  const action = async (act: string) => {
    setLoading(true);
    playSFX(act==="hit"?"card_deal":"card_flip", 0.3);
    const d = await post({ action:act, gameState:{ deck, player, hiddenDealer:hidden, bet }, bet });
    if (d.error) { setLoading(false); return; }
    setPlayer(d.player); setPScore(d.playerScore);
    if (d.status !== "playing") {
      setDealer(d.dealer); setDScore(d.dealerScore);
      setResult({ status:d.status, net:d.net });
      onBalanceChange(d.newBalance); setPhase("done");
      if (d.net > 0) playSFX("blackjack_win", 0.5);
      else playSFX("blackjack_bust", 0.5);
    } else setDeck(d.deck ?? deck);
    setLoading(false);
  };

  const reset = () => { setPhase("betting"); setPlayer([]); setDealer([]); setResult(null); setPScore(0); setDScore(0); };

  const STATUS: Record<string,{label:string;color:string;icon:string}> = {
    win:{ label:"You Win!", color:"#10b981", icon:"🎉" },
    blackjack:{ label:"BLACKJACK!", color:"#f59e0b", icon:"🃏" },
    lose:{ label:"Dealer Wins", color:"#ef4444", icon:"💔" },
    bust:{ label:"Bust!", color:"#ef4444", icon:"💥" },
    push:{ label:"Push", color:"#94a3b8", icon:"🤝" },
  };

  return (
    <div className="h-full flex flex-col gap-4 p-2">
      <div className="flex-1 rounded-2xl p-4 md:p-6 relative overflow-hidden"
        style={{ background:"linear-gradient(135deg,rgba(2,44,34,0.85),rgba(5,78,58,0.4))", border:"1px solid rgba(16,185,129,0.2)" }}>
        <div className="absolute inset-0 rounded-2xl" style={{ boxShadow:"inset 0 0 60px rgba(16,185,129,0.04)" }} />
        {phase==="betting" && (
          <div className="flex items-center justify-center h-full"><div className="text-center"><div className="text-5xl mb-2">🎴</div><p className="text-slate-400">Place your bet to start</p></div></div>
        )}
        {phase !== "betting" && (
          <div className="space-y-5 relative">
            <Hand cards={dealer} score={phase==="done"?dScore:0} label="Dealer" isDealer={phase==="playing"} />
            <div className="border-t border-white/5" />
            <Hand cards={player} score={pScore} label="You" />
          </div>
        )}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity:0, scale:0.85, y:12 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0 }}
              className="absolute inset-0 flex items-center justify-center rounded-2xl"
              style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)" }}>
              <div className="text-center">
                <div className="text-5xl mb-2">{STATUS[result.status]?.icon}</div>
                <p className="text-2xl font-black mb-1" style={{ color:STATUS[result.status]?.color }}>{STATUS[result.status]?.label}</p>
                {result.net !== undefined && result.net !== 0 && (
                  <p className="text-3xl font-black" style={{ color:result.net>0?"#34d399":"#f87171" }}>
                    {result.net>0?"+":"-"}🍪{fmt(Math.abs(result.net))}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        {phase==="betting" && (
          <>
            <BetInput bet={bet} onChange={setBet} balance={balance} disabled={loading} />
            <button onClick={deal} disabled={loading||balance<bet} className="btn-primary w-full py-3">{loading?"Dealing…":"Deal Cards"}</button>
          </>
        )}
        {phase==="playing" && (
          <div className="flex gap-2">
            {[{a:"hit",l:"Hit",e:"👆"},{a:"stand",l:"Stand",e:"✋"},{a:"double",l:"Double",e:"×2"}].map(({a,l,e})=>(
              <button key={a} onClick={()=>action(a)} disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 disabled:opacity-40"
                style={{ background:a==="stand"?"rgba(239,68,68,0.15)":"rgba(139,92,246,0.15)", border:"1px solid", borderColor:a==="stand"?"rgba(239,68,68,0.35)":"rgba(139,92,246,0.35)", color:a==="stand"?"#f87171":"#a78bfa" }}>
                {e} {l}
              </button>
            ))}
          </div>
        )}
        {phase==="done" && <button onClick={reset} className="btn-primary w-full py-3">Play Again</button>}
      </div>
    </div>
  );
}
