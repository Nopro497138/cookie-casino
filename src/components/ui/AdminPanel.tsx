
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { fmt } from "@/lib/utils";
import { formatText } from "@/lib/formatText";
import toast from "react-hot-toast";

interface AdminUser { id:string; discordId:string; name:string; image:string; balance:number; usdBalance:number; isBanned:boolean; banReason:string|null; gamesPlayed:number; totalWon:number; totalLost:number; createdAt:string; }
interface AdminLog { id:string; adminName:string; action:string; targetName:string|null; details:string|null; createdAt:string; }
interface Appeal { id:string; reason:string; additionalInfo:string|null; status:string; adminNote:string|null; createdAt:string; user:{ name:string; image:string; discordId:string; banReason:string|null }; }

type AdminTab = "users"|"logs"|"appeals"|"announce";

export function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [stats, setStats] = useState<Record<string,number>|null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminUser|null>(null);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [annTitle, setAnnTitle] = useState("");
  const [annMsg, setAnnMsg] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [appealNote, setAppealNote] = useState("");

  const fetchUsers = (q="") => fetch(`/api/admin?action=users&q=${encodeURIComponent(q)}`).then(r=>r.json()).then(d=>setUsers(d.users??[]));
  useEffect(() => {
    fetchUsers();
    fetch("/api/admin?action=stats").then(r=>r.json()).then(setStats);
    fetch("/api/admin?action=logs").then(r=>r.json()).then(d=>setLogs(d.logs??[]));
    fetch("/api/admin?action=appeals").then(r=>r.json()).then(d=>setAppeals(d.appeals??[]));
  }, []);

  const doAction = async (action: string, extra: Record<string,unknown>={}) => {
    if (!selected && !["announce"].includes(action)) return;
    setActionLoading(action);
    const res = await fetch("/api/admin", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action, targetId:selected?.discordId, amount, reason, ...extra }) });
    const d = await res.json();
    if (d.success||d.announcement) {
      toast.success("Done!");
      fetchUsers(search);
      fetch("/api/admin?action=logs").then(r=>r.json()).then(d=>setLogs(d.logs??[]));
    } else toast.error(d.error??"Failed");
    setActionLoading(null);
  };

  const reviewAppeal = async (appealId: string, verdict: string) => {
    setActionLoading(appealId+verdict);
    const res = await fetch("/api/admin", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"appeal_review", appealId, verdict, adminNote:appealNote }) });
    const d = await res.json();
    if (d.success) { toast.success(`Appeal ${verdict}`); fetch("/api/admin?action=appeals").then(r=>r.json()).then(d=>setAppeals(d.appeals??[])); }
    else toast.error(d.error??"Failed");
    setActionLoading(null); setAppealNote("");
  };

  const ACTION_LOG_LABELS: Record<string,string> = { give:"💚 Gave Cookies", take:"🔴 Took Cookies", ban:"🚫 Banned", unban:"✅ Unbanned", reset_balance:"🔄 Reset Balance", announce:"📢 Announced", appeal_approved:"✅ Appeal Approved", appeal_denied:"❌ Appeal Denied", add_usd:"💵 Added USD" };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="text-center">
        <h2 className="text-3xl font-black mb-1" style={{ background:"linear-gradient(135deg,#a855f7,#9333ea)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          👑 Admin Panel
        </h2>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{l:"Users",v:stats.totalUsers,icon:"👥"},{l:"Total Cookies",v:"🍪"+fmt(stats.totalBalance||0),icon:"🍪"},{l:"Games Played",v:stats.totalGames||0,icon:"🎮"},{l:"Transactions",v:stats.totalTransactions||0,icon:"📊"}].map(s=>(
            <div key={s.l} className="glass rounded-xl p-3 text-center" style={{ border:"1px solid rgba(147,51,234,0.2)" }}>
              <div className="text-xl mb-0.5">{s.icon}</div>
              <p className="text-lg font-black text-white">{s.v}</p>
              <p className="text-xs text-slate-400">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(["users","logs","appeals","announce"] as AdminTab[]).map(t => (
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
            style={{ background:tab===t?"rgba(147,51,234,0.25)":"rgba(255,255,255,0.04)", border:"1px solid", borderColor:tab===t?"rgba(147,51,234,0.5)":"rgba(255,255,255,0.08)", color:tab===t?"#c084fc":"#64748b" }}>
            {t==="users"?"👥 Users":t==="logs"?"📋 Logs":t==="appeals"?"⚖️ Appeals":"📢 Announce"}
            {t==="appeals"&&appeals.filter(a=>a.status==="pending").length>0&&<span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white">{appeals.filter(a=>a.status==="pending").length}</span>}
          </button>
        ))}
      </div>

      {tab==="users" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 glass rounded-2xl p-4 space-y-3">
            <div className="flex gap-2">
              <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchUsers(search)}
                placeholder="Search by name or Discord ID…"
                className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-sm outline-none text-white"
                style={{ borderColor:"rgba(255,255,255,0.1)" }} />
              <button onClick={()=>fetchUsers(search)} className="btn-primary px-4">🔍</button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {users.map(u=>(
                <button key={u.id} onClick={()=>{setSelected(u);setAmount(0);setReason("");}}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-white/5"
                  style={{ background:selected?.id===u.id?"rgba(147,51,234,0.15)":"transparent", border:"1px solid", borderColor:selected?.id===u.id?"rgba(147,51,234,0.4)":u.isBanned?"rgba(239,68,68,0.2)":"transparent" }}>
                  {u.image&&<Image src={u.image} alt="" width={32} height={32} className="rounded-full shrink-0" style={{ opacity:u.isBanned?0.5:1 }} />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color:u.isBanned?"#f87171":"#e2e8f0" }}>{u.name}</p>
                    <p className="text-xs text-slate-500">{u.discordId}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-yellow-400">🍪{fmt(u.balance)}</p>
                    <p className="text-xs text-green-400">💵${u.usdBalance?.toFixed(2)??0}</p>
                    {u.isBanned&&<span className="text-xs text-red-400">BANNED</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 glass rounded-2xl p-4 space-y-3">
            {!selected ? (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Select a user</div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"rgba(147,51,234,0.1)", border:"1px solid rgba(147,51,234,0.2)" }}>
                  {selected.image&&<Image src={selected.image} alt="" width={36} height={36} className="rounded-full" />}
                  <div>
                    <p className="font-bold text-white text-sm">{selected.name}</p>
                    <p className="text-xs text-slate-400">🍪{fmt(selected.balance)} · 💵${selected.usdBalance?.toFixed(2)??0}</p>
                    {selected.isBanned&&<p className="text-xs text-red-400">Banned: {selected.banReason}</p>}
                  </div>
                </div>
                <input type="number" value={amount} onChange={e=>setAmount(+e.target.value)} min={0} placeholder="Amount"
                  className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm outline-none text-white"
                  style={{ borderColor:"rgba(255,255,255,0.1)" }} />
                <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason (optional)"
                  className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm outline-none text-white"
                  style={{ borderColor:"rgba(255,255,255,0.1)" }} />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {a:"give",l:"Give 🍪",bg:"rgba(16,185,129,0.2)",bc:"rgba(16,185,129,0.4)",c:"#34d399"},
                    {a:"take",l:"Take 🍪",bg:"rgba(245,158,11,0.2)",bc:"rgba(245,158,11,0.4)",c:"#fbbf24"},
                    {a:"add_usd",l:"Give 💵",bg:"rgba(16,185,129,0.1)",bc:"rgba(16,185,129,0.3)",c:"#6ee7b7"},
                    {a:"reset",l:"Reset Bal",bg:"rgba(99,102,241,0.2)",bc:"rgba(99,102,241,0.4)",c:"#818cf8"},
                    {a:selected.isBanned?"unban":"ban",l:selected.isBanned?"Unban ✅":"Ban 🚫",bg:selected.isBanned?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)",bc:selected.isBanned?"rgba(16,185,129,0.4)":"rgba(239,68,68,0.4)",c:selected.isBanned?"#34d399":"#f87171"},
                  ].map(({a,l,bg,bc,c})=>(
                    <button key={a} onClick={()=>doAction(a)} disabled={actionLoading===a}
                      className="py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 disabled:opacity-40"
                      style={{ background:bg, border:`1px solid ${bc}`, color:c }}>
                      {actionLoading===a?"…":l}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab==="logs" && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {logs.map((log,i)=>(
              <div key={log.id} className="flex items-start gap-3 px-4 py-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                <span className="text-lg shrink-0">{ACTION_LOG_LABELS[log.action]?.split(" ")[0]??"📝"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white"><span className="text-purple-400 font-semibold">{log.adminName}</span> {ACTION_LOG_LABELS[log.action]?.split(" ").slice(1).join(" ")??log.action} {log.targetName&&<span className="text-slate-300">→ {log.targetName}</span>}</p>
                  {log.details&&<p className="text-xs text-slate-400 mt-0.5">{log.details}</p>}
                </div>
                <p className="text-xs text-slate-500 shrink-0">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {logs.length===0&&<div className="text-center py-12 text-slate-500">No logs yet</div>}
          </div>
        </div>
      )}

      {tab==="appeals" && (
        <div className="space-y-3">
          {appeals.length===0&&<div className="text-center py-12 text-slate-500"><div className="text-4xl mb-2">⚖️</div><p>No appeals</p></div>}
          {appeals.map(a=>(
            <div key={a.id} className="glass rounded-2xl p-4 space-y-3" style={{ border:`1px solid ${a.status==="pending"?"rgba(245,158,11,0.3)":a.status==="approved"?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {a.user.image&&<Image src={a.user.image} alt="" width={36} height={36} className="rounded-full shrink-0" />}
                  <div>
                    <p className="font-semibold text-white">{a.user.name}</p>
                    <p className="text-xs text-slate-400">Banned: {a.user.banReason}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full capitalize shrink-0" style={{ background:a.status==="pending"?"rgba(245,158,11,0.2)":a.status==="approved"?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)", color:a.status==="pending"?"#fbbf24":a.status==="approved"?"#34d399":"#f87171" }}>
                  {a.status}
                </span>
              </div>
              <div className="p-3 rounded-xl text-sm text-slate-300" style={{ background:"rgba(255,255,255,0.04)" }}>
                <p className="text-xs text-slate-400 mb-1">Appeal reason:</p>
                {formatText(a.reason)}
              </div>
              {a.additionalInfo&&<div className="text-xs text-slate-400">{formatText(a.additionalInfo)}</div>}
              {a.status==="pending"&&(
                <div className="flex gap-2">
                  <input value={appealNote} onChange={e=>setAppealNote(e.target.value)} placeholder="Admin note (optional)"
                    className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-sm outline-none text-white"
                    style={{ borderColor:"rgba(255,255,255,0.1)" }} />
                  <button onClick={()=>reviewAppeal(a.id,"approved")} disabled={!!actionLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background:"rgba(16,185,129,0.2)", border:"1px solid rgba(16,185,129,0.4)", color:"#34d399" }}>
                    ✅ Approve
                  </button>
                  <button onClick={()=>reviewAppeal(a.id,"denied")} disabled={!!actionLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171" }}>
                    ❌ Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="announce" && (
        <div className="max-w-xl mx-auto glass rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">📢 New Announcement</h3>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Title</label>
            <input value={annTitle} onChange={e=>setAnnTitle(e.target.value)}
              className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm outline-none text-white"
              style={{ borderColor:"rgba(255,255,255,0.1)" }} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Message (supports **bold**, _italic_, `code`, ~~strike~~)</label>
            <textarea value={annMsg} onChange={e=>setAnnMsg(e.target.value)} rows={5}
              className="w-full bg-transparent border rounded-xl px-3 py-2 text-sm outline-none text-white resize-none"
              style={{ borderColor:"rgba(255,255,255,0.1)" }} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={annPinned} onChange={e=>setAnnPinned(e.target.checked)} className="accent-purple-500" />
            📌 Pin this announcement
          </label>
          {annMsg && (
            <div className="p-3 rounded-xl text-sm text-slate-300" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-slate-500 mb-1">Preview:</p>
              {formatText(annMsg)}
            </div>
          )}
          <button onClick={()=>doAction("announce",{title:annTitle,message:annMsg,pinned:annPinned})} disabled={!annTitle||!annMsg||!!actionLoading}
            className="btn-primary w-full py-3 disabled:opacity-40">
            {actionLoading==="announce"?"Sending…":"📢 Send to All Users"}
          </button>
        </div>
      )}
    </div>
  );
}
