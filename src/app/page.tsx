"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle, Clock, Map as MapIcon, Network, FileBarChart, HardHat, Terminal } from "lucide-react";
import { toast } from "sonner";

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

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    // Initial fetch
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Error fetching stats:", err));

    // Listen to WS for live global dashboard updates
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
    const ws = new WebSocket(`${wsUrl}/api/ws/alarms`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "FIBER_CUT_ALARM") {
          const alarmCtx = payload.data;
          
          toast.error(`⚠️ ALARM: ${alarmCtx.message}`);
          
          // Add to live feed
          setEvents(prev => [{
            id: alarmCtx.alarm_id,
            time: new Date(alarmCtx.timestamp).toLocaleTimeString(),
            message: alarmCtx.message,
            severity: "critical"
          }, ...prev].slice(0, 10)); // Keep last 10
          
          // Re-fetch stats so KPI cards update dynamically!
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/dashboard/stats`)
            .then((res) => res.json())
            .then((data) => setStats(data));
        } else if (payload.type === "FIBER_RESTORED") {
          const restCtx = payload.data;
          
          toast.success(`✅ RESTORED: ${restCtx.message}`);
          
          setEvents(prev => [{
            id: Math.random().toString(),
            time: new Date().toLocaleTimeString(),
            message: `Segment ${restCtx.segment_id.split("-")[0]} - ${restCtx.message}`,
            severity: "healthy"
          }, ...prev].slice(0, 10));
          
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/dashboard/stats`)
            .then((res) => res.json())
            .then((data) => setStats(data));
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Global Command Dashboard</h1>
        <p className="text-slate-400 mt-2">Real-time infrastructure topology and fault diagnostics</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 text-slate-100">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex items-center shadow-lg transition-transform hover:-translate-y-1 hover:border-slate-700 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 mr-4 border border-blue-500/20">
            <Network size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Network Segments</p>
            <h3 className="text-2xl font-bold">{stats ? stats.segment_count : '...'}</h3>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex items-center shadow-lg transition-transform hover:-translate-y-1 hover:border-red-900/50 backdrop-blur-md relative overflow-hidden">
          {stats && stats.active_alarms > 0 && (
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse pointer-events-none" />
          )}
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 mr-4 border border-red-500/20 z-10">
            <AlertTriangle className={stats && stats.active_alarms > 0 ? "animate-pulse" : ""} size={24} />
          </div>
          <div className="z-10">
            <p className="text-sm font-medium text-slate-400">Active Fault Alarms</p>
            <h3 className="text-2xl font-bold text-red-400">{stats ? stats.active_alarms : '...'}</h3>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex items-center shadow-lg transition-transform hover:-translate-y-1 hover:border-amber-900/50 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 mr-4 border border-amber-500/20">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Open Work Orders</p>
            <h3 className="text-2xl font-bold text-amber-400">{stats ? stats.open_work_orders : '...'}</h3>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex items-center shadow-lg transition-transform hover:-translate-y-1 hover:border-emerald-900/50 backdrop-blur-md">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 mr-4 border border-emerald-500/20">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Global Uptime (30d)</p>
            <h3 className="text-2xl font-bold text-emerald-400">{stats ? stats.avg_availability_30d_pct.toFixed(2) : '...'}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {/* Main Navigation Modules */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2 uppercase tracking-wider text-sm">Target Operations Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <Link href="/map" className="group bg-slate-900/60 p-6 border border-slate-800 rounded-xl hover:border-blue-500/50 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden backdrop-blur">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <MapIcon size={32} className="mb-3 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200">GIS Core Map</span>
              <span className="text-xs text-slate-500 text-center mt-1">Live routing & diagnostics</span>
            </Link>
            
            <Link href="/alarms" className="group bg-slate-900/60 p-6 border border-slate-800 rounded-xl hover:border-red-500/50 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden backdrop-blur">
              <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <AlertTriangle size={32} className="mb-3 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200">Incident Logs</span>
              <span className="text-xs text-slate-500 text-center mt-1">Faults tracking overview</span>
            </Link>
            
            <Link href="/work-orders" className="group bg-slate-900/60 p-6 border border-slate-800 rounded-xl hover:border-amber-500/50 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden backdrop-blur">
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <HardHat size={32} className="mb-3 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200">Unit Dispatch</span>
              <span className="text-xs text-slate-500 text-center mt-1">Repair team work orders</span>
            </Link>
            
            <Link href="/reports" className="group bg-slate-900/60 p-6 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden backdrop-blur">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <FileBarChart size={32} className="mb-3 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-slate-200">Intelligence Reports</span>
              <span className="text-xs text-slate-500 text-center mt-1">Availability & MTTR analytics</span>
            </Link>
          </div>
        </div>

        {/* Live Event Feed Widget */}
        <div className="bg-black/60 rounded-xl border border-slate-800 flex flex-col overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal size={14} />
              <h2 className="font-bold text-xs uppercase tracking-widest">Live Node Comms</h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider">WS Linked</span>
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto max-h-[300px] font-mono text-xs">
            {events.length === 0 ? (
              <div className="text-slate-600 italic text-center mt-10 whitespace-pre">
                {`[ SYSTEM NOMINAL ]\n\nAwaiting network streams...`}
              </div>
            ) : (
              <ul className="space-y-4">
                {events.map(ev => {
                  const isHealthy = ev.severity === "healthy";
                  return (
                    <li key={ev.id} className={`border-l pl-3 relative ${isHealthy ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
                      <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500/50' : 'bg-red-500/50'}`} />
                      <span className={`block text-[10px] mb-1 font-bold tracking-widest uppercase ${isHealthy ? 'text-emerald-500' : 'text-red-500'}`}>{ev.time}</span>
                      <span className="text-slate-300 leading-relaxed text-[11px]">{ev.message}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
