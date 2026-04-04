"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon paths in Next.js
import L from "leaflet";
L.Icon.Default.imagePath = "/images/leaflet/";

// Segment interface matching backend
interface Segment {
  id: string;
  name: string;
  base_code: string;
  route_geojson: {
    type: string;
    coordinates: number[][]; // [lng, lat][]
  };
  length_km: number;
  status: "healthy" | "degraded" | "cut";
  availability_30d_pct: number;
}

export default function MapComponent() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  // Center of the map roughly around the initial seeding area (North India)
  const mapCenter: [number, number] = [30.7333, 76.7794]; // Chandigarh default

  useEffect(() => {
    // Fetch segments from our FastAPI backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/segments`)
      .then((res) => res.json())
      .then((data) => {
        setSegments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching map segments:", err);
        setLoading(false);
      });
      
    // Set up WebSocket connection for real-time alarms
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
    const ws = new WebSocket(`${wsUrl}/api/ws/alarms`);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "FIBER_CUT_ALARM") {
          const alarmCtx = payload.data;
          
          import("sonner").then(({ toast }) => {
            toast.error(`⚠️ ALARM: ${alarmCtx.message}`, {
              description: `Location: [${alarmCtx.lat}, ${alarmCtx.lng}] - ${new Date(alarmCtx.timestamp).toLocaleTimeString()}`,
              duration: 10000,
            });
          });

          // Mark segment as cut instantly on map
          setSegments(prev => prev.map(seg => 
            seg.id === alarmCtx.segment_id ? { ...seg, status: "cut" } : seg
          ));
        } else if (payload.type === "FIBER_RESTORED") {
          const restCtx = payload.data;

          import("sonner").then(({ toast }) => {
            toast.success(`✅ NETWORK HEALED: ${restCtx.message}`, {
              duration: 8000,
            });
          });

          // Mark segment back to healthy instantly on map
          setSegments(prev => prev.map(seg => 
            seg.id === restCtx.segment_id ? { ...seg, status: "healthy" } : seg
          ));
        }
      } catch (err) {
        console.error("Failed to parse WS msg", err);
      }
    };
    
    return () => {
      ws.close();
    }
  }, []);

  const getLineColor = (status: Segment["status"]) => {
    switch (status) {
      case "cut": return "#ef4444"; // red-500
      case "degraded": return "#f59e0b"; // amber-500
      case "healthy": return "#22c55e"; // green-500
      default: return "#3b82f6"; // blue-500
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center bg-gray-100 text-gray-500">Loading Network Map...</div>;
  }

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={7} 
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {segments.map((segment) => {
        // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
        const positions: [number, number][] = segment.route_geojson.coordinates.map(
          (coord) => [coord[1], coord[0]] as [number, number]
        );

        // Making "cut" segment throb or visually thicker
        const isCut = segment.status === "cut";

        return (
          <Polyline
            key={segment.id}
            positions={positions}
            pathOptions={{ 
              color: getLineColor(segment.status), 
              weight: isCut ? 8 : 5,
              opacity: isCut ? 1 : 0.8,
              dashArray: isCut ? "10, 10" : undefined
            }}
            className={isCut ? "animate-pulse shadow-lg" : ""}
          >
            <Tooltip sticky>
              <div className="text-sm">
                <strong className="block border-b pb-1 mb-1 text-gray-800">{segment.name} ({segment.base_code})</strong>
                <p>Status: <span className="font-semibold uppercase" style={{ color: getLineColor(segment.status) }}>{segment.status}</span></p>
                <p>Length: {segment.length_km} km</p>
                <p>Uptime (30d): {segment.availability_30d_pct}%</p>
              </div>
            </Tooltip>
          </Polyline>
        );
      })}
    </MapContainer>
  );
}
