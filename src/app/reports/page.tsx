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
    fetch("http://127.0.0.1:8000/api/segments")
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-8 py-6 relative">
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <Link href="/" className="flex items-center text-gray-500 hover:text-blue-600 transition-colors">
            <ChevronLeft size={20} />
            <span className="font-medium ml-1">Dashboard</span>
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 flex justify-center items-center gap-2">
            <FileText className="text-emerald-500" />
            Network Availability Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">Export Health and Uptime Metrics</p>
        </div>
      </header>

      <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
            <div>
              <h2 className="text-lg font-bold text-gray-800">IAF OFC Link Summary</h2>
              <div className="flex items-center text-xs text-gray-500 mt-1 gap-1">
                <Calendar size={14} />
                <span>Rolling 30-Day Evaluation</span>
              </div>
            </div>
            
            <button 
              onClick={handleExportCSV}
              disabled={loading || segments.length === 0}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium text-sm disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                  <th className="p-4">Segment / Route</th>
                  <th className="p-4">Base Code</th>
                  <th className="p-4">Length</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-right">30d Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">Generating reports...</td></tr>
                ) : segments.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No segment data found.</td></tr>
                ) : (
                  segments.map((seg) => (
                    <tr key={seg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{seg.name}</td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">{seg.base_code}</span>
                      </td>
                      <td className="p-4 text-gray-600">{seg.length_km} km</td>
                      <td className="p-4">
                        {seg.status === 'healthy' ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>Healthy
                          </span>
                        ) : seg.status === 'cut' ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <span className="h-1.5 w-1.5 rounded-full animate-ping bg-red-500"></span>Cut
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>Degraded
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-semibold ${seg.availability_30d_pct >= 99.9 ? 'text-green-600' : 'text-amber-600'}`}>
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
