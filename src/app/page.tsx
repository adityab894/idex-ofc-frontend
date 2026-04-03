import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        OFC Network Management System
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mb-8">
        Indigenous GIS based OFC (Optical Fiber Cable) Network Management System for the Indian Air Force. Real-time fault detection, route tracking, and availability monitoring.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl pt-8">
        <Link href="/map" className="p-6 border rounded-xl hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center">
          <span className="text-2xl mb-2">🗺️</span>
          <span className="font-medium">Live GIS Map</span>
        </Link>
        <Link href="/network" className="p-6 border rounded-xl hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center">
          <span className="text-2xl mb-2">📡</span>
          <span className="font-medium">Network Nodes</span>
        </Link>
        <Link href="/alarms" className="p-6 border rounded-xl hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center">
          <span className="text-2xl mb-2">🚨</span>
          <span className="font-medium">Active Alarms</span>
        </Link>
        <Link href="/reports" className="p-6 border rounded-xl hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center">
          <span className="text-2xl mb-2">📊</span>
          <span className="font-medium">Reports</span>
        </Link>
      </div>
    </div>
  );
}
