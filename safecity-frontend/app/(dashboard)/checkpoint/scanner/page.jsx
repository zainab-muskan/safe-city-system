"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function CheckpointScanner() {
  const { user } = useAuth();
  const [plate, setPlate] = useState("");
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVehicleData(null);
    setSuccessMsg("");

    try {
      const { data } = await api.get(`/vehicles/${plate}`);
      setVehicleData(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Plate not found in registry. This is an unregistered vehicle!");
      } else {
        setError(err.response?.data?.message || "Search failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (threatType) => {
    try {
      await api.post("/incidents/manual-alert", {
        plateText: plate,
        threatType,
        notes: `Manual scan at Checkpoint by ${user?.name}`,
      });
      setSuccessMsg("Alert successfully dispatched to Control Room!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create alert");
    }
  };

  return (
    <ProtectedRoute requiredRole="checkpoint_officer">
      <div className="p-4 md:p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-display font-semibold mb-6">Plate Scanner</h1>

        <form onSubmit={handleSearch} className="mb-6">
          <label className="block text-sm font-medium text-text-muted mb-2">
            Enter License Plate
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="e.g. ABC-123"
              className="input-field flex-1 uppercase"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-signal-teal text-bg-deep font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Scan"}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-4 bg-alert-critical/10 border border-alert-critical/30 rounded-lg">
            <p className="text-alert-critical font-medium mb-3">{error}</p>
            {error.includes("unregistered") && (
              <button
                onClick={() => handleCreateAlert("unregistered_plate")}
                className="w-full py-2 bg-alert-critical text-white rounded-lg font-semibold"
              >
                Create Unregistered Alert
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="p-4 mb-4 bg-signal-teal/10 border border-signal-teal/30 rounded-lg">
            <p className="text-signal-teal font-medium">{successMsg}</p>
          </div>
        )}

        {vehicleData && (
          <div className="card border-borderline">
            <h2 className="text-lg font-semibold mb-4">Registry Details</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-text-muted uppercase">Plate</p>
                <p className="font-mono text-lg">{vehicleData.plateNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted uppercase">Model</p>
                  <p>{vehicleData.model}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase">Color</p>
                  <p>{vehicleData.color}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase">Owner</p>
                <p>{vehicleData.ownerName}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase">Status</p>
                <span
                  className={
                    vehicleData.legalStatus === "clear"
                      ? "badge-resolved mt-1 inline-block"
                      : "badge-critical mt-1 inline-block"
                  }
                >
                  {vehicleData.legalStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {vehicleData.legalStatus === "stolen" ? (
              <button
                onClick={() => handleCreateAlert("stolen_flag")}
                className="w-full py-2 bg-alert-critical text-white rounded-lg font-semibold"
              >
                Create Stolen Vehicle Alert
              </button>
            ) : (
              <button
                onClick={() => handleCreateAlert("manual_officer_alert")}
                className="w-full py-2 bg-alert-warning text-bg-deep rounded-lg font-semibold"
              >
                Flag Suspicious Activity
              </button>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
