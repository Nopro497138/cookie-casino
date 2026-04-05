
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { fmt } from "@/lib/utils";
import toast from "react-hot-toast";

interface AdminUser {
  id:string; discordId:string; name:string; image:string; balance:number;
  isBanned:boolean; banReason:string|null; gamesPlayed:number; totalWon:number; totalLost:number; createdAt:string;
}

export function AdminPanel() {
  const [users,setUsers] = useState<AdminUser[]>([]);
  const [stats,setStats] = useState<{totalUsers:number,totalBalance:number,totalGames:number}|null>(null);
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(false);
  const [selected,setSelected] = useState<AdminUser|null>(null);
  const [amount,setAmount] = useState(0);
  const [reason,setReason] = useState("");
  const [actionLoading,setActionLoading] = useState<string|null>(null);

  const fetchUsers = async (q="") => {
    setLoading(true);
    const res = await fetch(`/api/admin?action=users&q=${encodeURIComponent(q)}`);
    const d = await res.json();
    setUsers(d.users||[]);
    setLoading(false);
  };

  useEffect(()=>{
    fetchUsers();
    fetch("/api/admin?action=stats").then(r=>r.json()).then(setStats);
  },[]);

  const doAction = async (action: string, extra: object = {}) => {
    if (!selected) return;
    setActionLoading(action);
    const res = await fetch("/api/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,targetId:selected.discordId,amount,reason,...extra})});
    const d = await res.json();
    if (d.success) {
      toast.success("Action performed!");
      fetchUsers(search);
      if (action==="give"||action==="take") setSelected(s=>s?{...s,balance:d.newBalance}:s);
    } else toast.error(d.error||"Failed");
    setActionLoading(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-black mb-1" style={{background:"linear-gradient(135deg,#a855f7,#9333ea)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          👑 Admin Panel
        </h2>
        <p className="text-slate-400 text-sm">Manage users and site settings</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[{l:"Total Users",v:stats.totalUsers,icon:"👥"},{l:"Total Balance",v:"🍪"+fmt(stats.totalBalance),icon:"🍪"},{l:"Games Played",v:stats.totalGames,icon:"🎮"}].map(s=>(
            <div key={s.l} className="glass rounded-xl p-4 text-center"
              style={{border:"1px solid rgba(147,51,234,0.2)",boxShadow:"0 0 20px rgba(147,51,234,0.05)"}}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-xl font-black text-white">{s.v}</p>
              <p className="text-xs text-slate-400">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* User list */}
        <div className="lg:col-span-3 glass rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchUsers(search)}
              placeholder="Search by name or Discord ID…"
              className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-sm outline-none"
              style={{borderColor:"rgba(255,255,255,0.1)",color:"white"}} />
            <button onClick={()=>fetchUsers(search)} className="btn-primary px-4">🔍</button>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {loading && <div className="text-center py-8 text-slate-500">Loading…</div>}
            {!loading && users.map(u=>(
              <button key={u.id} onClick={()=>{setSelected(u);setAmount(0);setReason("");}}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-white/5"
                style={{background:selected?.id===u.id?"rgba(147,51,234,0.15)":"transparent",border:"1px solid",borderColor:selected?.id===u.id?"rgba(147,51,234,0.4)":u.isBanned?"rgba(239,68,68,0.2)":"transparent"}}>
                {u.image&&<Image src={u.image} alt="" width={36} height={36} className="rounded-full" style={{opacity:u.isBanned?0.4:1}} />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{color:u.isBanned?"#f87171":"#e2e8f0"}}>{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.discordId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{color:"#f59e0b"}}>🍪{fmt(u.balance)}</p>
                  {u.isBanned&&<span className="text-xs text-red-400">BANNED</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action panel */}
        <div className="lg:col-span-2 glass rounded-2xl p-4 space-y-4">
          {!selected ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
              Select a user to manage
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:"rgba(147,51,234,0.1)",border:"1px solid rgba(147,51,234,0.2)"}}>
                {selected.image&&<Image src={selected.image} alt="" width={40} height={40} className="rounded-full" />}
                <div>
                  <p className="font-bold text-white">{selected.name}</p>
                  <p className="text-xs text-slate-400">🍪{fmt(selected.balance)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400">Cookie Amount</label>
                <input type="number" value={amount} onChange={e=>setAmount(+e.target.value)} min={0}
                  className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm outline-none text-white"
                  style={{borderColor:"rgba(255,255,255,0.1)"}} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Reason (optional)</label>
                <input value={reason} onChange={e=>setReason(e.target.value)}
                  className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm outline-none text-white"
                  style={{borderColor:"rgba(255,255,255,0.1)"}} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {a:"give",l:"Give 🍪",c:"rgba(16,185,129,0.2)",bc:"rgba(16,185,129,0.4)",tc:"#34d399"},
                  {a:"take",l:"Take 🍪",c:"rgba(245,158,11,0.2)",bc:"rgba(245,158,11,0.4)",tc:"#fbbf24"},
                  {a:"reset",l:"Reset Balance",c:"rgba(99,102,241,0.2)",bc:"rgba(99,102,241,0.4)",tc:"#818cf8"},
                  {a:selected.isBanned?"unban":"ban",l:selected.isBanned?"Unban ✅":"Ban 🚫",c:selected.isBanned?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)",bc:selected.isBanned?"rgba(16,185,129,0.4)":"rgba(239,68,68,0.4)",tc:selected.isBanned?"#34d399":"#f87171"},
                ].map(({a,l,c,bc,tc})=>(
                  <button key={a} onClick={()=>doAction(a)} disabled={actionLoading===a}
                    className="py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 disabled:opacity-40"
                    style={{background:c,border:`1px solid ${bc}`,color:tc}}>
                    {actionLoading===a?"…":l}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
