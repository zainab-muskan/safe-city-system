"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import api, { BASE_URL } from "@/lib/api";

const POLL_INTERVAL = 5000;

function CheckpointAlertsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [notes, setNotes] = useState({});
  const [newCount, setNewCount] = useState(0);
  const [lastPoll, setLastPoll] = useState(null);
  const prevCountRef = useRef(0);
  const pollRef = useRef(null);

  const loadIncidents = useCallback(async (silent = false) => {
    if (!user?.assignedCheckpoint) return;
    if (!silent) setLoading(true);
    try {
      const checkpointId =
        typeof user.assignedCheckpoint === "object"
          ? user.assignedCheckpoint._id
          : user.assignedCheckpoint;
      const { data } = await api.get(`/incidents/checkpoint/${checkpointId}`);
      
      if (silent && data.length > prevCountRef.current) {
        setNewCount(data.length - prevCountRef.current);
        setTimeout(() => setNewCount(0), 3000);
      }
      prevCountRef.current = data.length;

      setIncidents(data);
      setLastPoll(new Date());
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadIncidents(true);
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [loadIncidents]);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await api.patch(`/incidents/${id}/resolve`, {
        resolutionNotes: notes[id] || "Vehicle intercepted and verified.",
      });
      loadIncidents();
    } finally {
      setResolvingId(null);
    }
  };

  if (!user?.assignedCheckpoint) {
    return (
      <div className="p-6 max-w-lg">
        <div className="card p-6 text-center text-text-muted">
          You're not currently assigned to a checkpoint. Contact your Super Admin.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-display font-semibold">Incoming Alerts</h1>
        <div className="flex items-center gap-3">
          {lastPoll && (
            <span className="text-xs font-mono text-text-muted hidden sm:inline">
              Updated {lastPoll.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-teal animate-pulseDot" />
            <span className="text-xs font-mono text-text-muted uppercase tracking-wide">
              Live Sector Feed
            </span>
          </div>
        </div>
      </div>
      
      {newCount > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-signal-teal/10 border border-signal-teal/30 text-signal-teal text-sm font-mono animate-pulse mt-4">
          🚨 {newCount} new alert{newCount > 1 ? "s" : ""} dispatched!
        </div>
      )}
      
      <div className="mb-6"></div>

      {loading ? (
        <p className="text-text-muted font-mono text-sm">Loading alerts...</p>
      ) : incidents.length === 0 ? (
        <div className="card p-6 text-center text-text-muted text-sm">
          No alerts currently routed to your checkpoint.
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-lg">{inc.detectedPlateText}</p>
                  <p className="text-sm text-text-muted">
                    {inc.detectedModel}
                    {inc.detectedColor && inc.detectedColor !== "Unknown" && ` · ${inc.detectedColor}`}
                  </p>
                </div>
                <span
                  className={
                    inc.status === "resolved" ? "badge-resolved" : "badge-critical"
                  }
                >
                  {inc.status}
                </span>
              </div>
              
              {inc.snapshotUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-borderline">
                  <img 
                    src={`${BASE_URL}${inc.snapshotUrl}`} 
                    alt={`Vehicle ${inc.detectedPlateText}`}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {inc.matchedVehicle && (
                <div className="bg-bg-raised p-3 rounded-lg mb-3 border border-borderline">
                  <p className="text-xs text-text-muted mb-2">
                    Registry status:{" "}
                    <span className={inc.matchedVehicle.legalStatus === 'clear' ? "text-signal-teal uppercase font-semibold" : "text-alert-critical uppercase font-semibold"}>
                      {inc.matchedVehicle.legalStatus}
                    </span>
                  </p>
                  <p className="text-xs font-mono text-text-muted uppercase mb-1">Registered Owner</p>
                  <p className="text-sm font-semibold">{inc.matchedVehicle.ownerName}</p>
                  <p className="text-xs text-text-muted">
                    CNIC: {inc.matchedVehicle.ownerCNIC} &middot; Ph: {inc.matchedVehicle.ownerContact}
                  </p>
                </div>
              )}

              {inc.threatType === "citizen_report" && inc.citizenReportDetails && (
                <div className="bg-bg-raised rounded p-3 mb-3 border border-borderline">
                  <p className="text-xs font-mono text-text-muted uppercase mb-1">Citizen Report Details</p>
                  
                  {inc.citizenReportDetails.locationDetails && (
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      Location: <span className="font-normal">{inc.citizenReportDetails.locationDetails}</span>
                    </p>
                  )}
                  
                  <p className="text-sm italic text-text-primary">"{inc.citizenReportDetails.description}"</p>
                </div>
              )}

              {inc.status === "dispatched" && (
                <div className="space-y-2">
                  <textarea
                    className="input-field text-sm"
                    rows={2}
                    placeholder="Resolution notes (e.g. driver detained, documents verified)"
                    value={notes[inc._id] || ""}
                    onChange={(e) =>
                      setNotes({ ...notes, [inc._id]: e.target.value })
                    }
                  />
                  <button
                    onClick={() => handleResolve(inc._id)}
                    disabled={resolvingId === inc._id}
                    className="btn-primary w-full"
                  >
                    {resolvingId === inc._id ? "Resolving..." : "Mark Resolved"}
                  </button>
                </div>
              )}

              {inc.status === "resolved" && inc.resolutionNotes && (
                <p className="text-xs text-text-muted italic border-t border-borderline pt-2 mt-2">
                  "{inc.resolutionNotes}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProtectedCheckpointAlertsPage() {
  return (
    <ProtectedRoute allowedRoles={["checkpoint_officer", "super_admin"]}>
      <CheckpointAlertsPage />
    </ProtectedRoute>
  );
}
