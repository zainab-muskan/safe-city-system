"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";

// Dynamically import the map component (Leaflet requires window/document)
const CityMap = dynamic(() => import("@/components/CityMap"), { ssr: false });

const POLL_INTERVAL = 5000;

function LiveMapPage() {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastPoll, setLastPoll] = useState(null);
  const pollRef = useRef(null);

  const loadMapData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get("/stats/map");
      setMapData(data);
      setLastPoll(new Date());
    } catch (err) {
      console.error("Failed to load map data", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Auto-polling
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadMapData(true);
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [loadMapData]);

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-60px)] md:h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-semibold">City Map</h1>
          <p className="text-text-muted text-sm">
            Live view of cameras, checkpoints, and active threats.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastPoll && (
            <span className="text-xs font-mono text-text-muted">
              Updated {lastPoll.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-teal animate-pulseDot" />
            <span className="text-xs font-mono text-text-muted uppercase tracking-wide">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
          <span className="text-text-muted">Camera</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-signal-teal inline-block" />
          <span className="text-text-muted">Checkpoint</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-alert-critical inline-block animate-pulse" />
          <span className="text-text-muted">Active Threat</span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-borderline">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-bg-raised">
            <p className="text-text-muted font-mono text-sm">Loading map data...</p>
          </div>
        ) : mapData ? (
          <CityMap
            cameras={mapData.cameras}
            checkpoints={mapData.checkpoints}
            activeIncidents={mapData.activeIncidents}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bg-raised">
            <p className="text-text-muted font-mono text-sm">Failed to load map.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedLiveMapPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin", "operator"]}>
      <LiveMapPage />
    </ProtectedRoute>
  );
}
