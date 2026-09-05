"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api, { BASE_URL } from "@/lib/api";

const POLL_INTERVAL = 5000; // 5 seconds

const THREAT_LABEL = {
  unregistered_plate: "Unregistered Plate",
  plate_vehicle_mismatch: "Plate-Vehicle Mismatch",
  stolen_flag: "Stolen Vehicle",
  citizen_report: "Citizen Report",
  manual_officer_alert: "Officer Alert",
};

const STATUS_BADGE = {
  pending_review: "badge-warning",
  confirmed: "badge-critical",
  dispatched: "badge-critical",
  false_positive: "badge-pending",
  resolved: "badge-resolved",
};

function AlertsPage() {
  const [incidents, setIncidents] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpoints, setSelectedCheckpoints] = useState({});
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [filter, setFilter] = useState("pending_review");
  const [newCount, setNewCount] = useState(0);
  const [lastPoll, setLastPoll] = useState(null);
  const [editingPlate, setEditingPlate] = useState(null); // which incident ID is being edited
  const [correctedPlates, setCorrectedPlates] = useState({}); // { incidentId: "CORRECTED_TEXT" }
  const prevCountRef = useRef(0);
  const pollRef = useRef(null);

  const loadIncidents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [{ data: incData }, { data: cpData }] = await Promise.all([
        api.get(filter ? `/incidents?status=${filter}` : "/incidents"),
        api.get("/checkpoints"),
      ]);

      // Flash new incident count
      if (silent && incData.length > prevCountRef.current) {
        setNewCount(incData.length - prevCountRef.current);
        setTimeout(() => setNewCount(0), 3000);
      }
      prevCountRef.current = incData.length;

      setIncidents(incData);
      setCheckpoints(cpData);
      setLastPoll(new Date());
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  // Initial load
  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // Auto-polling
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadIncidents(true); // silent poll
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [loadIncidents]);

  const handleReview = async (id, decision, checkpointId = null) => {
    setActioningId(id);
    try {
      const payload = { decision, checkpointId };
      // If the operator corrected the plate, send it
      if (correctedPlates[id]) {
        payload.correctedPlateText = correctedPlates[id];
      }
      await api.patch(`/incidents/${id}/review`, payload);
      setEditingPlate(null);
      setCorrectedPlates((prev) => { const n = {...prev}; delete n[id]; return n; });
      loadIncidents();
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl h-[calc(100vh-60px)] md:h-screen flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-display font-semibold">AI Alerts</h1>
        <div className="flex items-center gap-3">
          {lastPoll && (
            <span className="text-xs font-mono text-text-muted">
              Updated {lastPoll.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-teal animate-pulseDot" />
            <span className="text-xs font-mono text-text-muted uppercase tracking-wide">
              Live · Auto-refresh
            </span>
          </div>
        </div>
      </div>

      {newCount > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-signal-teal/10 border border-signal-teal/30 text-signal-teal text-sm font-mono animate-pulse">
          🚨 {newCount} new alert{newCount > 1 ? "s" : ""} detected!
        </div>
      )}
      <p className="text-text-muted text-sm mb-6">
        Review incoming detections against registry data before dispatch.
      </p>

      <div className="flex gap-2 mb-6">
        {[
          { key: "pending_review", label: "Pending" },
          { key: "dispatched", label: "Dispatched" },
          { key: "resolved", label: "Resolved" },
          { key: "", label: "All" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
              filter === tab.key
                ? "bg-signal-teal/10 text-signal-teal border border-signal-teal/30"
                : "text-text-muted border border-borderline hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
      {loading ? (
        <p className="text-text-muted font-mono text-sm">Scanning for incidents...</p>
      ) : incidents.length === 0 ? (
        <div className="card p-8 text-center text-text-muted">
          No incidents in this view.
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {incidents.map((inc) => (
            <div key={inc._id} className="card overflow-hidden relative">
              {inc.status === "pending_review" && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-bg-raised overflow-hidden">
                  <div className="h-full w-1/3 bg-signal-teal animate-scan" />
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="badge-critical mb-2 inline-block">
                      {THREAT_LABEL[inc.threatType] || inc.threatType}
                    </span>
                    
                    {/* Editable Plate Number */}
                    {editingPlate === inc._id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          className="input-field font-mono text-lg tracking-wide uppercase w-40"
                          value={correctedPlates[inc._id] ?? inc.detectedPlateText}
                          onChange={(e) =>
                            setCorrectedPlates({
                              ...correctedPlates,
                              [inc._id]: e.target.value.toUpperCase(),
                            })
                          }
                          autoFocus
                        />
                        <button
                          onClick={async () => {
                            try {
                              const newPlate = correctedPlates[inc._id];
                              if (newPlate && newPlate !== inc.detectedPlateText) {
                                await api.patch(`/incidents/${inc._id}/plate`, { correctedPlateText: newPlate });
                              }
                              setEditingPlate(null);
                              loadIncidents();
                            } catch (err) {
                              console.error("Failed to update plate", err);
                              setEditingPlate(null);
                            }
                          }}
                          className="text-signal-teal text-sm font-semibold"
                          title="Save correction"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg tracking-wide">
                          {correctedPlates[inc._id] || inc.detectedPlateText}
                        </p>
                        {inc.status === "pending_review" && (
                          <button
                            onClick={() => {
                              setEditingPlate(inc._id);
                              if (!correctedPlates[inc._id]) {
                                setCorrectedPlates({
                                  ...correctedPlates,
                                  [inc._id]: inc.detectedPlateText,
                                });
                              }
                            }}
                            className="text-text-muted hover:text-signal-teal transition-colors"
                            title="Correct plate number"
                          >
                            ✏️
                          </button>
                        )}
                        {correctedPlates[inc._id] && correctedPlates[inc._id] !== inc.detectedPlateText && (
                          <span className="text-xs text-signal-teal font-mono">(corrected)</span>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-text-muted">
                      {inc.detectedModel}
                      {inc.detectedColor && inc.detectedColor !== "Unknown" && ` · ${inc.detectedColor}`}
                      {inc.camera ? (
                        <> &middot; {inc.camera.name} ({inc.camera.direction})</>
                      ) : inc.citizenReportDetails?.locationDetails ? (
                        <> &middot; 📍 {inc.citizenReportDetails.locationDetails}</>
                      ) : null}
                    </p>
                  </div>
                  <span className={STATUS_BADGE[inc.status]}>
                    {inc.status.replace("_", " ")}
                  </span>
                </div>
                
                {inc.snapshotUrl && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-borderline">
                    <img 
                      src={`${BASE_URL}${inc.snapshotUrl}`} 
                      alt={`Vehicle ${inc.detectedPlateText}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                {inc.citizenReportDetails?.description && (
                  <div className="mb-4 bg-bg-raised p-3 rounded-lg border border-borderline">
                    <p className="text-xs font-mono text-text-muted uppercase mb-1">Citizen Report</p>
                    <p className="text-sm italic">"{inc.citizenReportDetails.description}"</p>
                    {inc.citizenReportDetails.reporterName && (
                      <p className="text-xs text-text-muted mt-2">
                        Reported by: {inc.citizenReportDetails.reporterName} {inc.citizenReportDetails.reporterCnic ? `(${inc.citizenReportDetails.reporterCnic})` : ""}
                      </p>
                    )}
                  </div>
                )}

                {/* Side-by-side comparison: detected vs. registry */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-bg-raised rounded-lg p-3">
                    <p className="text-xs font-mono text-text-muted uppercase mb-2">
                      {inc.threatType === "citizen_report" ? "Reported Vehicle" : "AI Detected"}
                    </p>
                    <p className="text-sm">{inc.detectedModel}</p>
                    {inc.detectedColor && inc.detectedColor !== "Unknown" && (
                      <p className="text-sm text-text-muted">{inc.detectedColor}</p>
                    )}
                  </div>
                  <div className="bg-bg-raised rounded-lg p-3">
                    <p className="text-xs font-mono text-text-muted uppercase mb-2">
                      Registry Match
                    </p>
                    {inc.matchedVehicle ? (
                      <>
                        <p className="text-sm font-semibold">{inc.matchedVehicle.model}</p>
                        <p className="text-sm text-text-muted mb-2">
                          {inc.matchedVehicle.color} &middot;{" "}
                          <span className={inc.matchedVehicle.legalStatus === 'clear' ? "text-signal-teal" : "text-alert-critical font-semibold"}>
                            {inc.matchedVehicle.legalStatus.toUpperCase()}
                          </span>
                        </p>
                        
                        <div className="mt-2 pt-2 border-t border-borderline">
                          <p className="text-xs font-mono text-text-muted uppercase mb-1">Registered Owner</p>
                          <p className="text-sm font-semibold">{inc.matchedVehicle.ownerName}</p>
                          <p className="text-xs text-text-muted">
                            CNIC: {inc.matchedVehicle.ownerCNIC}
                            <br />
                            Ph: {inc.matchedVehicle.ownerContact}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-alert-warning">No match found</p>
                    )}
                  </div>
                </div>

                {inc.threatType === "citizen_report" && inc.citizenReportDetails && (
                  <div className="bg-bg-raised rounded-lg p-3 mb-4 border border-borderline">
                    <p className="text-xs font-mono text-text-muted uppercase mb-2">Citizen Report Details</p>
                    
                    {inc.citizenReportDetails.locationDetails && (
                      <p className="text-sm font-semibold mb-1">
                        Location: <span className="font-normal">{inc.citizenReportDetails.locationDetails}</span>
                      </p>
                    )}
                    
                    <p className="text-sm italic">"{inc.citizenReportDetails.description}"</p>
                    <p className="text-xs text-text-muted mt-2">
                      Reported by: {inc.citizenReportDetails.reporterName || "Anonymous"} 
                      {inc.citizenReportDetails.reporterCnic && ` (CNIC: ${inc.citizenReportDetails.reporterCnic})`}
                    </p>
                  </div>
                )}

                {inc.status === "pending_review" && (
                  <div className="space-y-3">
                    {inc.threatType === "citizen_report" && (
                      <div>
                        <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                          Select Checkpoint to Dispatch To:
                        </label>
                        <select
                          className="input-field text-sm"
                          value={selectedCheckpoints[inc._id] || ""}
                          onChange={(e) =>
                            setSelectedCheckpoints({
                              ...selectedCheckpoints,
                              [inc._id]: e.target.value,
                            })
                          }
                        >
                          <option value="">-- Choose Checkpoint --</option>
                          {checkpoints.map((cp) => (
                            <option key={cp._id} value={cp._id}>
                              {cp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(inc._id, "confirmed", selectedCheckpoints[inc._id])}
                        disabled={
                          actioningId === inc._id ||
                          (inc.threatType === "citizen_report" && !selectedCheckpoints[inc._id])
                        }
                        className="btn-primary flex-1 disabled:opacity-50"
                      >
                        {actioningId === inc._id ? "Dispatching..." : "Confirm & Dispatch"}
                      </button>
                      <button
                        onClick={() => handleReview(inc._id, "false_positive")}
                        disabled={actioningId === inc._id}
                        className="btn-secondary flex-1 disabled:opacity-50"
                      >
                        Mark False Positive
                      </button>
                    </div>
                  </div>
                )}

                {inc.routedToCheckpoint && (
                  <p className="text-xs font-mono text-text-muted mt-3">
                    Routed to {inc.routedToCheckpoint.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default function ProtectedAlertsPage() {
  return (
    <ProtectedRoute allowedRoles={["operator", "super_admin"]}>
      <AlertsPage />
    </ProtectedRoute>
  );
}
