"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, CheckCircle, ShieldAlert } from "lucide-react";

interface Alarm {
  id: string;
  segment_id: string;
  alarm_type: string;
  lat: number;
  lng: number;
  message: string;
  severity: string;
  created_at: string;
  acknowledged: boolean;
}

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlarms = () => {
    fetch("http://127.0.0.1:8000/api/alarms")
      .then((res) => res.json())
      .then((data) => {
        setAlarms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching alarms", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlarms();
  }, []);

  const handleAck = (id: string, currentAck: boolean) => {
    fetch(`http://127.0.0.1:8000/api/alarms/${id}/acknowledge`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acknowledged: !currentAck })
    }).then(() => fetchAlarms());
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="bg-slate-900 shadow-sm border-b border-slate-800 px-8 py-6 relative">
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <Link href="/" className="flex items-center text-slate-400 hover:text-red-500 transition-colors">
            <ChevronLeft size={20} />
            <span className="font-medium ml-1 text-sm tracking-wide">RETURN</span>
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 flex justify-center items-center gap-2">
            <ShieldAlert className="text-red-500" />
            INCIDENT PROTOCOL CENTER
          </h1>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest text-[10px]">Review and acknowledge network incident logs</p>
        </div>
      </header>

      <main className="flex-1 p-8 w-full max-w-5xl mx-auto">
        <div className="bg-slate-900/50 rounded-xl shadow border border-slate-800 overflow-hidden backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Incident Coordinates / Message</th>
                <th className="p-4 text-right">Action Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-sm">Scanning logs...</td></tr>
              ) : alarms.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-emerald-500/50 border-dashed border border-emerald-500/20 bg-emerald-500/5 m-4 rounded-xl text-sm font-mono tracking-widest">[ NETWORK SECURE : NO INCIDENTS ]</td></tr>
              ) : (
                alarms.map((al, idx) => (
                  <tr key={al.id} className={`transition-all ${al.acknowledged ? 'bg-slate-900/30 opacity-50 grayscale' : 'bg-red-500/5 hover:bg-red-500/10'}`}>
                    <td className="p-4 text-slate-500 font-mono text-xs text-center">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="p-4 text-xs font-mono text-slate-300 whitespace-nowrap">
                      {new Date(al.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${al.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {al.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-200 border-l-2 border-red-500 pl-3 py-1">
                        {al.message}
                        <div className="text-[10px] text-slate-500 mt-1 font-mono tracking-wider">
                          LAT: {al.lat.toFixed(4)} | LNG: {al.lng.toFixed(4)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleAck(al.id, al.acknowledged)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold tracking-widest uppercase transition-all border ${
                          al.acknowledged 
                            ? 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                            : 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        }`}
                      >
                        {al.acknowledged ? (
                          <><span>VERIFIED</span></>
                        ) : (
                          <><CheckCircle size={14} /><span>ACKNOWLEDGE</span></>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
