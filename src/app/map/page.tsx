"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";

export default function MapPage() {
  // Dynamically import MapComponent to disable Next.js Server Side Rendering for Leaflet
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/MapComponent"), {
        loading: () => <p>Map is loading...</p>,
        ssr: false,
      }),
    []
  );

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center justify-between p-4 bg-white shadow-sm z-10 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">IAF GIS Network Map</h1>
          <p className="text-sm text-gray-500">Live optical fiber network topology</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium transition-colors">
          &larr; Back to Dashboard
        </Link>
      </header>

      {/* The container for the map needs to have a definitive height */}
      <main className="flex-1 w-full bg-gray-50 relative min-h-[calc(100vh-80px)]">
        <Map />
      </main>
    </div>
  );
}
