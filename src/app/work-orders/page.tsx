"use client";

import Link from "next/link";
import { ChevronLeft, HardHat, FileWarning } from "lucide-react";

export default function WorkOrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-8 py-6 relative">
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <Link href="/" className="flex items-center text-gray-500 hover:text-amber-600 transition-colors">
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
      
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center max-w-lg">
          <FileWarning size={64} className="mx-auto text-amber-200 mb-6" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Work Order Module under Construction</h2>
          <p className="text-gray-500 text-balance mb-8">
            This module (Milestone 7) will integrate direct dispatching systems for ground repair units across target bases.
          </p>
          <Link href="/" className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800">
            Return to Command Center
          </Link>
        </div>
      </main>
    </div>
  );
}
