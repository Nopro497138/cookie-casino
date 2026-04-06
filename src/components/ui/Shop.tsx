
"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { formatText } from "@/lib/formatText";
import { playSFX } from "@/lib/sfx";
import toast from "react-hot-toast";

interface ShopItem { id:string; name:string; description:string; icon:string; priceUSD:number; category:string; available:boolean; }
interface ChatMsg { id:string; content:string; isAdmin:boolean; createdAt:string; user:{ name:string; image:string; }; }
interface Order { id:string; itemId:string; itemName:string; priceUSD:number; status:string; chatOpen:boolean; createdAt:string; messages:ChatMsg[]; user?:{ name:string; image:string; }; }

interface ShopProps { usdBalance: number; onUsdChange: (n: number) => void; onDepositClick: () => void; isAdmin?: boolean; }

export function Shop({ usdBalance, onUsdChange, onDepositClick, isAdmin }: ShopProps) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subTab, setSubTab] = useState<"store"|"orders">("store");
  const [selectedOrder, setSelectedOrder] = useState<Order|null>(null);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState<string|null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const loadOrders = () => fetch("/api/shop/orders").then(r=>r.json()).then(d=>setOrders(d.orders??[]));

  useEffect(() => {
    fetch("/api/shop").then(r=>r.json()).then(d=>setItems(d.items??[]));
    loadOrders();
  }, []);

  useEffect(() => {
    if (subTab==="orders") loadOrders();
  }, [subTab]);

  // Auto-refresh chat
  useEffect(() => {
    if (!selectedOrder) return;
    const t = setInterval(() => {
      loadOrders().then(() => {
        setOrders(prev => {
          const updated = prev.find(o => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
          return prev;
        });
      });
    }, 5000);
    return () => clearInterval(t);
  }, [selectedOrder?.id]);

  const buy = async (item: ShopItem) => {
    if (usdBalance < item.priceUSD) { toast.error(`Need $${item.priceUSD}. Deposit more first.`); return; }
    setLoading(item.id);
    const res = await fetch("/api/shop", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ itemId: item.id }) });
    const d = await res.json();
    if (d.order) {
      toast.success(`Purchased ${item.name}!`);
      playSFX("purchase", 0.5);
      onUsdChange(usdBalance - item.priceUSD);
      await loadOrders();
      setSubTab("orders");
    } else toast.error(d.error ?? "Purchase failed");
    setLoading(null);
  };

  const sendChat = async () => {
    if (!selectedOrder || !chatInput.trim()) return;
    setChatLoading(true);
    const res = await fetch("/api/shop/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ orderId: selectedOrder.id, content: chatInput }) });
    const d = await res.json();
    if (d.message) {
      setChatInput("");
      await loadOrders();
      setOrders(prev => {
        const updated = prev.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
        return prev;
      });
    } else toast.error(d.error ?? "Failed");
    setChatLoading(false);
  };

  const adminAction = async (orderId: string, action: string) => {
    await fetch("/api/shop/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ orderId, action }) });
    await loadOrders();
    setSelectedOrder(null);
  };

  const CATEGORY_COLOR: Record<string,string> = { general:"#6366f1", premium:"#a855f7", vip:"#f59e0b" };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-white mb-1">🛍️ Shop</h2>
          <p className="text-slate-400 text-sm">Purchase exclusive items with real money</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)" }}>
            <span className="text-green-400 font-bold">💵 ${usdBalance.toFixed(2)}</span>
          </div>
          <button onClick={onDepositClick} className="px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105" style={{ background:"linear-gradient(135deg,#10b981,#059669)", boxShadow:"0 0 20px rgba(16,185,129,0.4)" }}>
            + Deposit
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["store","orders"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className="px-5 py-2 rounded-xl font-semibold text-sm capitalize transition-all"
            style={{ background: subTab===t?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.04)", border:"1px solid", borderColor: subTab===t?"rgba(139,92,246,0.5)":"rgba(255,255,255,0.08)", color: subTab===t?"#a78bfa":"#64748b" }}>
            {t==="store"?"🛍️ Store":"💬 My Orders"}
          </button>
        ))}
      </div>

      {subTab==="store" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item, i) => {
            const cc = CATEGORY_COLOR[item.category] ?? "#6366f1";
            return (
              <motion.div key={item.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                className="rounded-2xl p-5 flex gap-4" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${cc}33`, opacity: item.available ? 1 : 0.5 }}>
                <span className="text-5xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold text-white">{item.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize shrink-0" style={{ background:`${cc}22`, color:cc }}>{item.category}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                  <button onClick={() => buy(item)} disabled={!item.available || loading===item.id || usdBalance < item.priceUSD}
                    className="px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-40"
                    style={{ background: item.available?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.05)", border:`1px solid ${item.available?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.1)"}`, color: item.available?"#34d399":"#64748b" }}>
                    {!item.available ? "Coming Soon" : loading===item.id ? "…" : `💵 $${item.priceUSD}`}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {subTab==="orders" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {orders.length===0 ? (
              <div className="text-center py-12 text-slate-500"><div className="text-4xl mb-2">📭</div><p>No orders yet</p></div>
            ) : orders.map(o => (
              <button key={o.id} onClick={()=>setSelectedOrder(o)}
                className="w-full text-left p-3 rounded-xl transition-all glass"
                style={{ border:`1px solid ${selectedOrder?.id===o.id?"rgba(139,92,246,0.5)":"rgba(255,255,255,0.07)"}`, background: selectedOrder?.id===o.id?"rgba(139,92,246,0.1)":"rgba(255,255,255,0.03)" }}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-white truncate">{o.itemName}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: o.status==="completed"?"rgba(16,185,129,0.2)":"rgba(245,158,11,0.2)", color: o.status==="completed"?"#34d399":"#fbbf24" }}>
                    {o.status}
                  </span>
                </div>
                {isAdmin && o.user && <p className="text-xs text-slate-500 mt-0.5">{o.user.name}</p>}
                <p className="text-xs text-slate-500 mt-0.5">💵 ${o.priceUSD} · {new Date(o.createdAt).toLocaleDateString()}</p>
                {!o.chatOpen && <p className="text-xs text-red-400 mt-0.5">Chat closed</p>}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 glass rounded-2xl flex flex-col" style={{ height:"400px" }}>
            {!selectedOrder ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Select an order to view chat</div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="font-semibold text-white text-sm">{selectedOrder.itemName}</p>
                    <p className="text-xs text-slate-500">{selectedOrder.chatOpen ? "Chat open" : "Chat closed"}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={()=>adminAction(selectedOrder.id,"toggle_chat")} className="text-xs px-2 py-1 rounded-lg" style={{ background:"rgba(245,158,11,0.15)", color:"#fbbf24" }}>
                        {selectedOrder.chatOpen?"Close Chat":"Open Chat"}
                      </button>
                      {selectedOrder.status!=="completed" && (
                        <button onClick={()=>adminAction(selectedOrder.id,"close_order")} className="text-xs px-2 py-1 rounded-lg" style={{ background:"rgba(16,185,129,0.15)", color:"#34d399" }}>
                          Complete Order
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {selectedOrder.messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                      {msg.isAdmin && <div className="w-7 h-7 rounded-full shrink-0" style={{ background:"rgba(147,51,234,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem" }}>A</div>}
                      <div className="max-w-[80%] px-3 py-2 rounded-xl text-xs" style={{ background: msg.isAdmin?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.06)", border:`1px solid ${msg.isAdmin?"rgba(139,92,246,0.3)":"rgba(255,255,255,0.08)"}` }}>
                        {msg.isAdmin && <p className="text-purple-400 font-semibold text-xs mb-0.5">Admin</p>}
                        <div className="text-slate-200">{formatText(msg.content)}</div>
                        <p className="text-slate-500 text-xs mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedOrder.chatOpen && (
                  <div className="flex gap-2 p-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                    <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}
                      placeholder="Type a message… (*bold*, _italic_, `code`)"
                      className="flex-1 bg-transparent border rounded-lg px-3 py-2 text-sm text-white outline-none"
                      style={{ borderColor:"rgba(255,255,255,0.1)" }} />
                    <button onClick={sendChat} disabled={chatLoading} className="btn-primary px-4">Send</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
