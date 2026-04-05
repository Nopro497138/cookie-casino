
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fmt } from "@/lib/utils";
import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/powerups";
import toast from "react-hot-toast";

interface OwnedPowerup { powerupId: string; quantity: number; }
interface CatalogPowerup { id:string; name:string; description:string; icon:string; price:number; color:string; rarity:Rarity; game:string; }

export function PowerupsShop({balance,onBalanceChange}:{balance:number,onBalanceChange:(n:number)=>void}) {
  const [catalog,setCatalog] = useState<CatalogPowerup[]>([]);
  const [owned,setOwned] = useState<OwnedPowerup[]>([]);
  const [loading,setLoading] = useState<string|null>(null);
  const [tab,setTab] = useState<"shop"|"inventory">("shop");

  useEffect(()=>{
    fetch("/api/user/powerups").then(r=>r.json()).then(d=>{setCatalog(d.catalog||[]);setOwned(d.owned||[]);});
  },[]);

  const buy = async (id: string, price: number, name: string) => {
    if (balance < price) { toast.error("Not enough cookies!"); return; }
    setLoading(id);
    const res = await fetch("/api/user/powerups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({powerupId:id,action:"buy"})});
    const d = await res.json();
    if (d.success) {
      toast.success(`Purchased ${name}!`);
      onBalanceChange(d.newBalance);
      setOwned(prev=>{const ex=prev.find(p=>p.powerupId===id);return ex?prev.map(p=>p.powerupId===id?{...p,quantity:p.quantity+1}:p):[...prev,{powerupId:id,quantity:1}];});
    } else toast.error(d.error||"Purchase failed");
    setLoading(null);
  };

  const ownedCount = (id: string) => owned.find(o=>o.powerupId===id)?.quantity??0;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black text-white mb-1">⚡ Powerups</h2>
        <p className="text-slate-400 text-sm">Gain an edge with special abilities</p>
      </div>

      <div className="flex gap-2 mb-6 justify-center">
        {(["shop","inventory"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className="px-5 py-2 rounded-xl font-semibold text-sm capitalize transition-all"
            style={{background:tab===t?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.04)",border:"1px solid",borderColor:tab===t?"rgba(139,92,246,0.5)":"rgba(255,255,255,0.08)",color:tab===t?"#a78bfa":"#64748b"}}>
            {t==="shop"?"🏪 Shop":"🎒 Inventory"}
          </button>
        ))}
      </div>

      {tab==="shop" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((p,i)=>{
            const rc = RARITY_COLOR[p.rarity];
            const rg = RARITY_GLOW[p.rarity];
            return (
              <motion.div key={p.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className="rounded-2xl p-4 flex flex-col gap-3 transition-all hover:scale-[1.02]"
                style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${rc}44`,boxShadow:`0 0 20px ${rg}`}}>
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{p.icon}</span>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full" style={{background:`${rc}22`,color:rc}}>{p.rarity}</span>
                    {ownedCount(p.id)>0 && <p className="text-xs text-slate-400 mt-1">Owned: {ownedCount(p.id)}</p>}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                  {p.game!=="all" && <p className="text-xs mt-1" style={{color:rc}}>🎮 {p.game}</p>}
                </div>
                <button onClick={()=>buy(p.id,p.price,p.name)} disabled={loading===p.id||balance<p.price}
                  className="mt-auto py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-40"
                  style={{background:`${rc}22`,border:`1px solid ${rc}55`,color:rc}}>
                  {loading===p.id?"…":"🍪 "+fmt(p.price)}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {tab==="inventory" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {owned.length===0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              <div className="text-5xl mb-3">🎒</div>
              <p>No powerups owned yet. Visit the shop!</p>
            </div>
          ) : owned.map((o,i)=>{
            const p = catalog.find(c=>c.id===o.powerupId);
            if (!p) return null;
            const rc = RARITY_COLOR[p.rarity];
            return (
              <motion.div key={p.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:i*0.05}}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${rc}44`}}>
                <span className="text-4xl">{p.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.description}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black" style={{color:rc}}>{o.quantity}</p>
                  <p className="text-xs text-slate-500">owned</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
