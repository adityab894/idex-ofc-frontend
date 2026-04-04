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
    fetch("http://127.0.0.1:8000/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Error fetching stats:", err));

    // Listen to WS for live global dashboard updates
    const ws = new WebSocket("ws://127.0.0.1:8000/api/ws/alarms");
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
          fetch("http://127.0.0.1:8000/api/dashboard/stats")
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
          
          fetch("http://127.0.0.1:8000/api/dashboard/stats")
            .then((res) => res.json())
            .then((data) => setStats(data));
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">IAF OFC Command Center</h1>
        <p className="text-gray-500 mt-2">Centralized Optical Fiber Network Management System</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 text-gray-800">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <Network size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Network Segments</p>
            <h3 className="text-2xl font-bold">{stats ? stats.segment_count : '...'}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
            <AlertTriangle className={stats && stats.active_alarms > 0 ? "animate-pulse" : ""} size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Fault Alarms</p>
            <h3 className="text-2xl font-bold text-red-600">{stats ? stats.active_alarms : '...'}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Open Work Orders</p>
            <h3 className="text-2xl font-bold text-amber-600">{stats ? stats.open_work_orders : '...'}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center shadow-lg transition-transform hover:-translate-y-1">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Global Uptime (30d)</p>
            <h3 className="text-2xl font-bold text-green-600">{stats ? stats.avg_availability_30d_pct.toFixed(2) : '...'}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {/* Main Navigation Modules */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Network Operations Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <Link href="/map" className="group bg-white p-6 border rounded-xl hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center justify-center min-h-[160px]">
              <MapIcon size={40} className="mb-4 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg text-gray-800">GIS Map</span>
              <span className="text-sm text-gray-500 text-center mt-1">Live routing & diagnostics</span>
            </Link>
            <Link href="/alarms" className="group bg-white p-6 border rounded-xl hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center justify-center min-h-[160px]">
              <AlertTriangle size={40} className="mb-4 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg text-gray-800">Alarm Logs</span>
              <span className="text-sm text-gray-500 text-center mt-1">Faults & incident history</span>
            </Link>
            <Link href="/work-orders" className="group bg-white p-6 border rounded-xl hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center justify-center min-h-[160px]">
              <HardHat size={40} className="mb-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg text-gray-800">Dispatch</span>
              <span className="text-sm text-gray-500 text-center mt-1">Repair team work orders</span>
            </Link>
            <Link href="/reports" className="group bg-white p-6 border rounded-xl hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center justify-center min-h-[160px]">
              <FileBarChart size={40} className="mb-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg text-gray-800">Analytics</span>
              <span className="text-sm text-gray-500 text-center mt-1">Availability & MTTR reports</span>
            </Link>
          </div>
        </div>

        {/* Live Event Feed Widget */}
        <div className="bg-white rounded-xl shadow border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-slate-800 text-white p-4 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Terminal size={18} />
              <h2 className="font-bold">Live System Logs</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold text-green-400">Listening WS</span>
            </div>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[350px] bg-slate-900 font-mono text-sm">
            {events.length === 0 ? (
              <div className="text-slate-500 italic text-center mt-10">Awaiting network streams...</div>
            ) : (
              <ul className="space-y-3">
                {events.map(ev => {
                  const isHealthy = ev.severity === "healthy";
                  return (
                    <li key={ev.id} className={`border-l-2 pl-3 ${isHealthy ? 'border-green-500' : 'border-red-500'}`}>
                      <span className={`block text-xs mb-1 ${isHealthy ? 'text-green-400' : 'text-red-400'}`}>{ev.time}</span>
                      <span className="text-gray-200">{ev.message}</span>
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
