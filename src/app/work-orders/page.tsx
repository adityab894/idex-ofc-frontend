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
        fetch("http://127.0.0.1:8000/api/work_orders"),
        fetch("http://127.0.0.1:8000/api/alarms")
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
    
    fetch(`http://127.0.0.1:8000/api/work_orders/${id}`, {
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
    
    fetch("http://127.0.0.1:8000/api/work_orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(() => fetchData());
  };

  // Filter alarms that don't have a linked work order
  const unassignedAlarms = alarms.filter(a => !workOrders.some(wo => wo.alarm_id === a.id));

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
            <HardHat className="text-amber-500" />
            Dispatch & Repair Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage field teams and fiber repair pipelines</p>
        </div>
      </header>

      <main className="flex-1 p-8 w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Col: Missing Work Orders */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Pending Action Needed
          </h2>
          {loading ? (
             <p className="text-sm text-gray-500">Loading incidents...</p>
          ) : unassignedAlarms.length === 0 ? (
            <div className="p-6 bg-white border border-gray-200 rounded-xl text-center text-gray-500 text-sm">
               All incidents have been successfully assigned work orders.
            </div>
          ) : (
            unassignedAlarms.map(a => (
              <div key={a.id} className="p-4 bg-white border-l-4 border-red-500 shadow-sm rounded-r-xl relative">
                <span className="text-xs text-gray-400 block mb-1">{new Date(a.created_at).toLocaleString()}</span>
                <p className="text-sm font-semibold text-gray-800 mb-4">{a.message}</p>
                <button 
                  onClick={() => generateWorkOrder(a)}
                  className="w-full py-2 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800"
                >
                  Create Work Order
                </button>
              </div>
            ))
          )}
        </div>

        {/* Right Col: Active/Past Work Orders */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Truck className="text-blue-500" size={20} />
            Active Repair Tickets
          </h2>
          
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 text-xs uppercase font-semibold">
                  <th className="p-4">Ticket details</th>
                  <th className="p-4">Assigned Team</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workOrders.length === 0 && !loading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">No active work orders.</td></tr>
                ) : (
                  workOrders.map((wo) => {
                    const isClosed = wo.status === "closed";
                    return (
                      <tr key={wo.id} className={isClosed ? 'bg-gray-50 opacity-60' : 'bg-white'}>
                        <td className="p-4">
                          <p className="font-semibold text-sm text-gray-900">{wo.title}</p>
                          <p className="text-xs font-mono text-gray-500 mt-1">ID: {wo.id.split("-")[0]}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-sm border py-1 px-2 rounded-md bg-gray-50 text-gray-700">{wo.assignee}</span>
                        </td>
                        <td className="p-4">
                          {wo.status === 'open' && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded font-bold uppercase">Pending</span>}
                          {wo.status === 'in_progress' && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold uppercase">Dispatched</span>}
                          {wo.status === 'closed' && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded font-bold uppercase">Resolved</span>}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleUpdateStatus(wo.id, wo.status)}
                            disabled={isClosed}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                              isClosed ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                              : wo.status === 'open' ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
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
