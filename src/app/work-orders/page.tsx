"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle, HardHat, AlertTriangle, Truck } from "lucide-react";

interface WorkOrder {
  id: string;
  alarm_id: string | null;
  segment_id: string;
  title: string;
  assignee: string;
  status: "open" | "in_progress" | "closed";
  instructions: string;
  created_at: string;
}

interface Alarm {
  id: string;
  segment_id: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [woRes, alarmRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/work_orders`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/alarms`)
      ]);
      const woData = await woRes.json();
      const alarmData = await alarmRes.json();
      setWorkOrders(woData);
      setAlarms(alarmData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching work orders/alarms", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle status update of work order
  const handleUpdateStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "open" ? "in_progress" : "closed";
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/work_orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    }).then(() => fetchData());
  };

  // Convert an alarm into a work order manually
  const generateWorkOrder = (alarm: Alarm) => {
    const payload = {
      alarm_id: alarm.id,
      segment_id: alarm.segment_id,
      title: `Emergency Repair: ${alarm.message}`,
      assignee: "Rapid Response Team " + Math.floor(Math.random() * 100),
      instructions: "Investigate and physically splice the severed fiber segment."
    };
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/work_orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(() => fetchData());
  };

  // Filter alarms that don't have a linked work order
  const unassignedAlarms = alarms.filter(a => !workOrders.some(wo => wo.alarm_id === a.id));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="bg-slate-900 shadow-sm border-b border-slate-800 px-8 py-6 relative">
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <Link href="/" className="flex items-center text-slate-400 hover:text-amber-500 transition-colors">
            <ChevronLeft size={20} />
            <span className="font-medium ml-1 text-sm tracking-wide">RETURN</span>
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 flex justify-center items-center gap-2">
            <HardHat className="text-amber-500" />
            FIELD DISPATCH CENTER
          </h1>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest text-[10px]">Manage field teams and fiber repair pipelines</p>
        </div>
      </header>

      <main className="flex-1 p-8 w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Col: Missing Work Orders */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          <h2 className="text-xs tracking-widest uppercase font-bold text-slate-300 flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-500" size={16} />
            Pending Action Needed
          </h2>
          {loading ? (
             <p className="text-sm text-slate-500 font-mono">Loading incidents...</p>
          ) : unassignedAlarms.length === 0 ? (
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-500 text-sm font-mono tracking-widest uppercase">
               [ ALL INCIDENTS ASSIGNED ]
            </div>
          ) : (
            unassignedAlarms.map(a => (
              <div key={a.id} className="p-4 bg-slate-900/60 border border-slate-800 border-l-4 border-l-red-500 shadow-lg relative backdrop-blur">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-2">{new Date(a.created_at).toLocaleString()}</span>
                <p className="text-sm font-semibold text-slate-200 mb-5">{a.message}</p>
                <button 
                  onClick={() => generateWorkOrder(a)}
                  className="w-full py-2 bg-slate-800 text-slate-300 rounded border border-slate-700 text-xs font-bold tracking-widest hover:bg-slate-700 hover:text-white uppercase transition-colors"
                >
                  Create Work Order
                </button>
              </div>
            ))
          )}
        </div>

        {/* Right Col: Active/Past Work Orders */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          <h2 className="text-xs tracking-widest uppercase font-bold text-slate-300 flex items-center gap-2 mb-2">
            <Truck className="text-blue-500" size={16} />
            Active Repair Tickets
          </h2>
          
          <div className="bg-slate-900/50 rounded-xl shadow border border-slate-800 overflow-hidden backdrop-blur">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold tracking-widest">
                  <th className="p-4">Ticket details</th>
                  <th className="p-4">Assigned Team</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {workOrders.length === 0 && !loading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-mono text-sm tracking-widest uppercase">[ No active tickets ]</td></tr>
                ) : (
                  workOrders.map((wo) => {
                    const isClosed = wo.status === "closed";
                    return (
                      <tr key={wo.id} className={isClosed ? 'bg-slate-900/40 opacity-50 grayscale' : 'bg-slate-900/20'}>
                        <td className="p-4">
                          <p className="font-semibold text-sm text-slate-200">{wo.title}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">ID: {wo.id.split("-")[0]}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] border border-slate-700 py-1 px-2 rounded bg-slate-800 text-slate-300 font-mono tracking-widest uppercase">{wo.assignee}</span>
                        </td>
                        <td className="p-4">
                          {wo.status === 'open' && <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest">Pending</span>}
                          {wo.status === 'in_progress' && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest">Dispatched</span>}
                          {wo.status === 'closed' && <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest">Resolved</span>}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleUpdateStatus(wo.id, wo.status)}
                            disabled={isClosed}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase transition-colors border ${
                              isClosed ? 'border-slate-800 text-slate-600 bg-slate-900/50 cursor-not-allowed'
                              : wo.status === 'open' ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                              : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                            }`}
                          >
                            {wo.status === 'open' ? 'Dispatch Team' : wo.status === 'in_progress' ? 'Mark Resolved' : 'Completed'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
