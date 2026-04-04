"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText, ChevronLeft, Calendar } from "lucide-react";

interface Segment {
  id: string;
  name: string;
  base_code: string;
  length_km: number;
  status: string;
  availability_30d_pct: number;
}

export default function ReportsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/segments`)
      .then((res) => res.json())
      .then((data) => {
        setSegments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching report data", err);
        setLoading(false);
      });
  }, []);

  const handleExportCSV = () => {
    if (segments.length === 0) return;

    // Build CSV Headers
    const headers = ["Segment Name", "Base Code", "Length (km)", "Network Status", "30-Day Availability (%)"];
    
    // Build CSV Rows
    const rows = segments.map((seg) => [
      `"${seg.name}"`, 
      `"${seg.base_code}"`, 
      seg.length_km.toString(), 
      `"${seg.status}"`, 
      seg.availability_30d_pct.toString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `OFC_Network_Availability_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="bg-slate-900 shadow-sm border-b border-slate-800 px-8 py-6 relative">
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <Link href="/" className="flex items-center text-slate-400 hover:text-emerald-500 transition-colors">
            <ChevronLeft size={20} />
            <span className="font-medium ml-1 text-sm tracking-wide">RETURN</span>
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 flex justify-center items-center gap-2">
            <FileText className="text-emerald-500" />
            INTELLIGENCE REPORTS
          </h1>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest text-[10px]">Export Health and Uptime Metrics</p>
        </div>
      </header>

      <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
        <div className="bg-slate-900/50 rounded-xl shadow border border-slate-800 overflow-hidden backdrop-blur-md">
          
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80">
            <div>
              <h2 className="text-lg font-bold text-slate-200">IAF OFC Link Summary</h2>
              <div className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 mt-1 gap-1">
                <Calendar size={14} />
                <span>Rolling 30-Day Evaluation</span>
              </div>
            </div>
            
            <button 
              onClick={handleExportCSV}
              disabled={loading || segments.length === 0}
              className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded hover:bg-emerald-500 hover:text-white transition-all font-bold tracking-widest uppercase text-[10px] disabled:opacity-50"
            >
              <Download size={14} />
              Export CSV Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
                  <th className="p-4">Segment / Route</th>
                  <th className="p-4">Base Code</th>
                  <th className="p-4">Length</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-right">30d Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-sm tracking-widest uppercase text-[10px]">Generating reports...</td></tr>
                ) : segments.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-sm tracking-widest uppercase text-[10px]">[ No segment data found ]</td></tr>
                ) : (
                  segments.map((seg) => (
                    <tr key={seg.id} className="hover:bg-slate-900/80 transition-colors">
                      <td className="p-4 font-bold text-slate-300 text-sm">{seg.name}</td>
                      <td className="p-4">
                        <span className="bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 flex w-min rounded text-[10px] uppercase font-mono tracking-widest">{seg.base_code}</span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs font-mono">{seg.length_km} km</td>
                      <td className="p-4">
                        {seg.status === 'healthy' ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded border border-emerald-500/20 text-[10px] tracking-widest font-bold uppercase bg-emerald-500/10 text-emerald-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>NOMINAL
                          </span>
                        ) : seg.status === 'cut' ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded border border-red-500/20 text-[10px] tracking-widest font-bold uppercase bg-red-500/10 text-red-500">
                            <span className="h-1.5 w-1.5 rounded-full animate-ping bg-red-500"></span>SEVERED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded border border-amber-500/20 text-[10px] tracking-widest font-bold uppercase bg-amber-500/10 text-amber-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>DEGRADED
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-mono text-sm tracking-wide font-bold ${seg.availability_30d_pct >= 99.9 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {seg.availability_30d_pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}
