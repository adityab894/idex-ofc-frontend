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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-8 py-6 relative">
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <Link href="/" className="flex items-center text-gray-500 hover:text-red-600 transition-colors">
            <ChevronLeft size={20} />
            <span className="font-medium ml-1">Dashboard</span>
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 flex justify-center items-center gap-2">
            <ShieldAlert className="text-red-500" />
            Alarm Processing Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review and acknowledge network incident logs</p>
        </div>
      </header>

      <main className="flex-1 p-8 w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 text-xs uppercase font-semibold">
                <th className="p-4 w-12">#</th>
                <th className="p-4">Time</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Message / Location</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading alarms...</td></tr>
              ) : alarms.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500 border-dashed border-2 m-4 rounded-xl">👍 No alarms in the system. Network is nominal.</td></tr>
              ) : (
                alarms.map((al, idx) => (
                  <tr key={al.id} className={`transition-colors ${al.acknowledged ? 'bg-white opacity-60' : 'bg-red-50/30'}`}>
                    <td className="p-4 text-gray-400 font-mono text-sm">{idx + 1}</td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(al.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${al.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {al.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 border-l-2 border-red-500 pl-2">
                        {al.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 pl-2 font-mono">
                        GEO: [{al.lat.toFixed(4)}, {al.lng.toFixed(4)}]
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleAck(al.id, al.acknowledged)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          al.acknowledged 
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        }`}
                      >
                        {al.acknowledged ? (
                          <><span>Acknowledged</span></>
                        ) : (
                          <><CheckCircle size={16} /><span>Acknowledge</span></>
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
