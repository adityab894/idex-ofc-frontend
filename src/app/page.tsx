"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Activity, AlertTriangle, Clock, Map as MapIcon,
  Network, FileBarChart, HardHat, Terminal, Shield,
  Wifi, WifiOff, ChevronRight, Zap
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";

interface DashboardStats {
  segment_count: number;
  active_alarms: number;
  open_work_orders: number;
  avg_availability_30d_pct: number;
  mean_time_to_repair_minutes: number;
}

interface FeedEvent {
  id: string;
  time: string;
  message: string;
  severity: string;
}

function AnimatedCounter({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === null) return;
    let start = 0;
    const end = value;
    if (start === end) { setDisplay(end); return; }
    const duration = 800;
    const stepTime = Math.abs(Math.floor(duration / (end - start))) || 16;
    const timer = setInterval(() => {
      start += 1;
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);
  if (value === null) return <span className="animate-pulse">--</span>;
  return <span>{typeof value === "number" && !Number.isInteger(value) ? value.toFixed(2) : display}{suffix}</span>;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [time, setTime] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);

  const fetchStats = () =>
    fetch(`${API}/api/dashboard/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});

  useEffect(() => {
    fetchStats();
    const tick = () => setTime(new Date().toLocaleTimeString("en-IN", { hour12: false }));
    tick();
    const clock = setInterval(tick, 1000);

    const ws = new WebSocket(`${WS_URL}/api/ws/alarms`);
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "FIBER_CUT_ALARM") {
          const d = payload.data;
          toast.error(`⚠️ ${d.message}`);
          setEvents((p) => [{ id: d.alarm_id, time: new Date(d.timestamp).toLocaleTimeString(), message: d.message, severity: "critical" }, ...p].slice(0, 15));
          fetchStats();
        } else if (payload.type === "FIBER_RESTORED") {
          const d = payload.data;
          toast.success(`✅ ${d.message}`);
          setEvents((p) => [{ id: Math.random().toString(), time: new Date().toLocaleTimeString(), message: `Segment restored — ${d.message}`, severity: "healthy" }, ...p].slice(0, 15));
          fetchStats();
        }
      } catch {}
    };
    return () => { ws.close(); clearInterval(clock); };
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [events]);

  const modules = [
    { href: "/map", icon: MapIcon, label: "GIS Core Map", sub: "Live fiber topology", color: "blue", glow: "shadow-blue-500/20" },
    { href: "/alarms", icon: AlertTriangle, label: "Incident Logs", sub: "Fault & alarm records", color: "red", glow: "shadow-red-500/20" },
    { href: "/work-orders", icon: HardHat, label: "Unit Dispatch", sub: "Repair team tickets", color: "amber", glow: "shadow-amber-500/20" },
    { href: "/reports", icon: FileBarChart, label: "Intel Reports", sub: "Uptime & MTTR data", color: "emerald", glow: "shadow-emerald-500/20" },
  ];

  const colorMap: Record<string, { border: string; text: string; bg: string; iconBg: string; ring: string }> = {
    blue:    { border: "hover:border-blue-500/60",    text: "text-blue-400",    bg: "hover:bg-blue-500/5",    iconBg: "bg-blue-500/10 border-blue-500/20",    ring: "group-hover:shadow-blue-500/20" },
    red:     { border: "hover:border-red-500/60",     text: "text-red-400",     bg: "hover:bg-red-500/5",     iconBg: "bg-red-500/10 border-red-500/20",      ring: "group-hover:shadow-red-500/20" },
    amber:   { border: "hover:border-amber-500/60",   text: "text-amber-400",   bg: "hover:bg-amber-500/5",   iconBg: "bg-amber-500/10 border-amber-500/20",   ring: "group-hover:shadow-amber-500/20" },
    emerald: { border: "hover:border-emerald-500/60", text: "text-emerald-400", bg: "hover:bg-emerald-500/5", iconBg: "bg-emerald-500/10 border-emerald-500/20", ring: "group-hover:shadow-emerald-500/20" },
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 relative overflow-hidden">

      {/* Background grid + glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
        {stats && stats.active_alarms > 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/3 rounded-full blur-[160px] animate-pulse" />
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-6 bg-emerald-400 rounded-full" />
                <div className="w-1 h-4 bg-emerald-400/50 rounded-full" />
                <div className="w-0.5 h-2 bg-emerald-400/20 rounded-full" />
              </div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-emerald-400/70 uppercase">Indian Air Force · OFC NMS · v1.0</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Global Command Center
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm">Real-time optical fiber network intelligence & fault management</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="font-mono text-2xl font-bold text-slate-200 tabular-nums tracking-wider">{time || "--:--:--"}</div>
            <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${wsConnected ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
              {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
              {wsConnected ? "Network Stream Active" : "Stream Offline"}
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

          {/* Segments */}
          <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl overflow-hidden group hover:border-blue-500/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Network size={18} className="text-blue-400" />
              </div>
              <Shield size={12} className="text-slate-600" />
            </div>
            <div className="text-3xl font-black text-white mb-1">
              <AnimatedCounter value={stats?.segment_count ?? null} />
            </div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">OFC Segments</p>
            <div className="mt-3 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Alarms */}
          <div className={`relative bg-slate-900/40 border rounded-2xl p-5 backdrop-blur-xl overflow-hidden group transition-all ${stats && stats.active_alarms > 0 ? "border-red-500/40 ring-1 ring-red-500/20" : "border-slate-800/80 hover:border-red-500/30"}`}>
            {stats && stats.active_alarms > 0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
            )}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all" />
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl bg-red-500/10 border border-red-500/20 ${stats && stats.active_alarms > 0 ? "animate-pulse" : ""}`}>
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              {stats && stats.active_alarms > 0 && (
                <span className="text-[9px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">LIVE</span>
              )}
            </div>
            <div className={`text-3xl font-black mb-1 ${stats && stats.active_alarms > 0 ? "text-red-400" : "text-white"}`}>
              <AnimatedCounter value={stats?.active_alarms ?? null} />
            </div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">Active Alarms</p>
            <div className="mt-3 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all" style={{ width: stats ? `${Math.min((stats.active_alarms / 10) * 100, 100)}%` : "0%" }} />
            </div>
          </div>

          {/* Work Orders */}
          <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Clock size={18} className="text-amber-400" />
              </div>
              <Zap size={12} className="text-slate-600" />
            </div>
            <div className="text-3xl font-black text-white mb-1">
              <AnimatedCounter value={stats?.open_work_orders ?? null} />
            </div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">Open Tickets</p>
            <div className="mt-3 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: stats ? `${Math.min((stats.open_work_orders / 5) * 100, 100)}%` : "0%" }} />
            </div>
          </div>

          {/* Uptime */}
          <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Activity size={18} className="text-emerald-400" />
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">30d</span>
            </div>
            <div className="text-3xl font-black text-emerald-400 mb-1">
              {stats ? `${stats.avg_availability_30d_pct.toFixed(1)}%` : <span className="animate-pulse text-white">--</span>}
            </div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">Network Uptime</p>
            <div className="mt-3 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: stats ? `${stats.avg_availability_30d_pct}%` : "0%" }} />
            </div>
          </div>

        </div>

        {/* ── BOTTOM SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Module Grid — 3 cols */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Operations Modules</h2>
              <div className="h-px flex-1 bg-slate-800/80 ml-4" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {modules.map(({ href, icon: Icon, label, sub, color }) => {
                const c = colorMap[color];
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group relative bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 overflow-hidden ${c.border} ${c.bg} hover:shadow-xl ${c.ring} hover:-translate-y-0.5`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity rounded-full blur-3xl -mr-10 -mt-10 ${color === 'blue' ? 'bg-blue-500/10' : color === 'red' ? 'bg-red-500/10' : color === 'amber' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`} />
                    <div className={`inline-flex p-3 rounded-xl border mb-4 ${c.iconBg}`}>
                      <Icon size={20} className={c.text} />
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-200 text-sm">{label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
                      </div>
                      <ChevronRight size={14} className={`${c.text} opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 mt-1`} />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* System Status Bar */}
            <div className="mt-1 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
                <span className="text-[11px] text-slate-400 font-mono tracking-widest uppercase">All Systems Operational</span>
              </div>
              <div className="flex items-center gap-4">
                {["API Gateway", "DB Cluster", "WS Stream"].map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-slate-500 font-mono">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Feed — 2 cols */}
          <div className="lg:col-span-2 flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-xl overflow-hidden">
            {/* Feed header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Terminal size={13} className="text-slate-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Live Intel Feed</span>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${wsConnected ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-emerald-400 animate-ping" : "bg-red-400"}`} />
                {wsConnected ? "Live" : "Offline"}
              </div>
            </div>

            {/* Feed body */}
            <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[340px] scrollbar-thin">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center">
                    <Terminal size={16} className="text-slate-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-mono text-slate-600 uppercase tracking-widest">[ SYSTEM NOMINAL ]</p>
                    <p className="text-[10px] text-slate-700 mt-1">Awaiting network transmissions...</p>
                  </div>
                </div>
              ) : (
                events.map((ev) => {
                  const isCrit = ev.severity === "critical";
                  return (
                    <div key={ev.id} className={`relative rounded-xl p-3 border backdrop-blur transition-all ${isCrit ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${isCrit ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>
                          {isCrit ? "⚠ CRITICAL" : "✓ RESTORED"}
                        </span>
                        <span className="text-[9px] font-mono text-slate-600">{ev.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-mono">{ev.message}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Feed footer */}
            <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-600">{events.length} event{events.length !== 1 ? "s" : ""} logged</span>
              <span className="text-[10px] font-mono text-slate-600">RETAINING LAST 15</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
