"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";

const DynamicMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full bg-bg-surface flex items-center justify-center rounded-lg border border-borderline text-text-muted text-sm font-mono">
      Loading Map...
    </div>
  ),
});

function CheckpointsPage() {
  const [checkpoints, setCheckpoints] = useState([]);
  const [officers, setOfficers] = useState([]); // All users with role=checkpoint_officer
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", lat: "", lng: "" });

  // Modal State
  const [assignModal, setAssignModal] = useState({ isOpen: false, checkpoint: null, selectedOfficerIds: [] });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cpRes, usersRes] = await Promise.all([
        api.get("/checkpoints"),
        api.get("/users")
      ]);
      setCheckpoints(cpRes.data);
      setOfficers(usersRes.data.filter(u => u.role === "checkpoint_officer" && u.isActive));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) {
      setError("Please click on the map to set the checkpoint location.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/checkpoints", {
        name: form.name,
        location: {
          type: "Point",
          coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
        },
      });
      setForm({ name: "", lat: "", lng: "" });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add checkpoint.");
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignModal = (cp) => {
    setAssignModal({
      isOpen: true,
      checkpoint: cp,
      selectedOfficerIds: cp.assignedOfficers.map(o => o._id)
    });
  };

  const toggleOfficerSelection = (id) => {
    setAssignModal(prev => ({
      ...prev,
      selectedOfficerIds: prev.selectedOfficerIds.includes(id)
        ? prev.selectedOfficerIds.filter(oId => oId !== id)
        : [...prev.selectedOfficerIds, id]
    }));
  };

  const saveAssignments = async () => {
    setSubmitting(true);
    try {
      await api.put(`/checkpoints/${assignModal.checkpoint._id}/officers`, {
        officerIds: assignModal.selectedOfficerIds
      });
      setAssignModal({ isOpen: false, checkpoint: null, selectedOfficerIds: [] });
      loadData();
      alert("Officers updated and SMS alerts have been dispatched!");
    } catch (err) {
      alert("Failed to assign officers.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold">Checkpoints</h1>
          <p className="text-text-muted text-sm mt-1">
            Physical security barriers where officers intercept flagged vehicles.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "Add Checkpoint"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-8 space-y-4">
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
              Checkpoint Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="Saddar Checkpoint"
            />
          </div>
          
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase flex justify-between">
              <span>Location Coordinates</span>
              {form.lat && form.lng && (
                <span className="text-signal-teal">
                  {form.lat}, {form.lng}
                </span>
              )}
            </label>
            <DynamicMap
              lat={form.lat}
              lng={form.lng}
              onChange={(lat, lng) => setForm({ ...form, lat, lng })}
            />
          </div>

          {error && <p className="text-alert-critical text-sm font-mono">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Saving..." : "Save Checkpoint"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-text-muted font-mono text-sm">Loading checkpoints...</p>
      ) : (
        <div className="grid gap-3">
          {checkpoints.map((cp) => (
            <div key={cp._id} className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-medium text-lg">{cp.name}</p>
                  <span className={cp.isActive ? "badge-resolved text-xs" : "badge-pending text-xs"}>
                    {cp.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                
                <div className="mt-2 text-sm text-text-muted">
                  <p className="mb-1 font-mono text-xs uppercase">Assigned Officers ({cp.assignedOfficers?.length || 0}):</p>
                  {cp.assignedOfficers?.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {cp.assignedOfficers.map(o => (
                        <li key={o._id}>{o.name} <span className="text-xs">({o.email})</span></li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic">None assigned</p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => openAssignModal(cp)}
                className="px-4 py-2 bg-bg-raised border border-borderline hover:border-signal-teal rounded-lg text-sm transition-colors"
              >
                Assign Officers
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-borderline p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-1">Assign Officers</h2>
            <p className="text-sm text-text-muted mb-6">Select officers to deploy at <strong>{assignModal.checkpoint.name}</strong>.</p>
            
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
              {officers.length === 0 ? (
                <p className="text-sm italic text-text-muted">No checkpoint officers found in the system.</p>
              ) : (
                officers.map(officer => {
                  const isSelected = assignModal.selectedOfficerIds.includes(officer._id);
                  return (
                    <label 
                      key={officer._id} 
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? "border-signal-teal bg-signal-teal/10" : "border-borderline hover:bg-bg-raised"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{officer.name}</p>
                        <p className="text-xs text-text-muted">{officer.email}</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOfficerSelection(officer._id)}
                        className="w-5 h-5 accent-signal-teal cursor-pointer"
                      />
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-borderline">
              <button 
                onClick={() => setAssignModal({ isOpen: false, checkpoint: null, selectedOfficerIds: [] })}
                className="px-4 py-2 hover:bg-bg-raised rounded-lg text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={saveAssignments}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Saving..." : "Save & Send Alerts"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedCheckpointsPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <CheckpointsPage />
    </ProtectedRoute>
  );
}
