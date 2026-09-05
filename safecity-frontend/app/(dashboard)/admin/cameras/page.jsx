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

function CamerasPage() {
  const [cameras, setCameras] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    direction: "",
    linkedCheckpoint: "",
    lat: "",
    lng: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [camerasRes, checkpointsRes] = await Promise.all([
        api.get("/cameras"),
        api.get("/checkpoints"),
      ]);
      setCameras(camerasRes.data);
      setCheckpoints(checkpointsRes.data);
    } catch (err) {
      setError("Failed to load cameras.");
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
      setError("Please click on the map to set the camera location.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/cameras", {
        name: form.name,
        direction: form.direction,
        linkedCheckpoint: form.linkedCheckpoint,
        location: {
          type: "Point",
          coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
        },
      });
      setForm({ name: "", direction: "", linkedCheckpoint: "", lat: "", lng: "" });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add camera.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold">Cameras</h1>
          <p className="text-text-muted text-sm mt-1">
            Register cameras and map them to downstream checkpoints.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "Add Camera"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Camera Name
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="6th Road Camera"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Direction
              </label>
              <input
                required
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value })}
                className="input-field"
                placeholder="Towards Saddar"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
              Linked Checkpoint
            </label>
            <select
              required
              value={form.linkedCheckpoint}
              onChange={(e) => setForm({ ...form, linkedCheckpoint: e.target.value })}
              className="input-field"
            >
              <option value="">Choose a checkpoint...</option>
              {checkpoints.map((cp) => (
                <option key={cp._id} value={cp._id}>
                  {cp.name}
                </option>
              ))}
            </select>
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
            {submitting ? "Saving..." : "Save Camera"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-text-muted font-mono text-sm">Loading cameras...</p>
      ) : cameras.length === 0 ? (
        <div className="card p-8 text-center text-text-muted">
          No cameras registered yet. Add your first one above.
        </div>
      ) : (
        <div className="grid gap-3">
          {cameras.map((cam) => (
            <div key={cam._id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{cam.name}</p>
                <p className="text-sm text-text-muted">
                  {cam.direction} &middot; linked to{" "}
                  <span className="text-signal-teal">
                    {cam.linkedCheckpoint?.name || "Unassigned"}
                  </span>
                </p>
              </div>
              <span className={cam.isActive ? "badge-resolved" : "badge-pending"}>
                {cam.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProtectedCamerasPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <CamerasPage />
    </ProtectedRoute>
  );
}
