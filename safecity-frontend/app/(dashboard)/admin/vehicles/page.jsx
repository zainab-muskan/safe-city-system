"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";

const STATUS_STYLES = {
  clean: "bg-signal-teal/10 text-signal-teal border border-signal-teal/30",
  stolen: "bg-alert-critical/10 text-alert-critical border border-alert-critical/30",
};

function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    plateNumber: "",
    model: "",
    color: "",
    shape: "",
    ownerName: "",
    ownerCNIC: "",
    legalStatus: "clean",
  });

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/vehicles");
      setVehicles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const resetForm = () => {
    setFormData({
      plateNumber: "",
      model: "",
      color: "",
      shape: "",
      ownerName: "",
      ownerCNIC: "",
      legalStatus: "clean",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (vehicle) => {
    setFormData({
      plateNumber: vehicle.plateNumber,
      model: vehicle.model,
      color: vehicle.color,
      shape: vehicle.shape || "",
      ownerName: vehicle.ownerName || "",
      ownerCNIC: vehicle.ownerCNIC || "",
      legalStatus: vehicle.legalStatus,
    });
    setEditingId(vehicle._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, formData);
      } else {
        await api.post("/vehicles", formData);
      }
      resetForm();
      loadVehicles();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving vehicle");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this vehicle from the registry?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      loadVehicles();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting vehicle");
    }
  };

  const handleToggleStolen = async (vehicle) => {
    const newStatus = vehicle.legalStatus === "clean" ? "stolen" : "clean";
    try {
      await api.put(`/vehicles/${vehicle._id}`, {
        ...vehicle,
        legalStatus: newStatus,
        reportedStolenAt: newStatus === "stolen" ? new Date() : null,
      });
      loadVehicles();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating status");
    }
  };

  const filtered = vehicles.filter(
    (v) =>
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.ownerName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-display font-semibold">Vehicle Registry</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          + Register Vehicle
        </button>
      </div>
      <p className="text-text-muted text-sm mb-6">
        Manage the central vehicle registry. Flag stolen vehicles for AI detection.
      </p>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          className="input-field max-w-md"
          placeholder="Search by plate, model, or owner..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <h3 className="font-medium text-lg">
            {editingId ? "Edit Vehicle" : "Register New Vehicle"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Plate Number
              </label>
              <input
                required
                type="text"
                className="input-field font-mono uppercase"
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                placeholder="ABC-123"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Model
              </label>
              <input
                required
                type="text"
                className="input-field"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Toyota Corolla"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Color
              </label>
              <input
                required
                type="text"
                className="input-field"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="White"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Shape
              </label>
              <select
                className="input-field"
                value={formData.shape}
                onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
              >
                <option value="">Select shape</option>
                <option value="Sedan">Sedan</option>
                <option value="Hatchback">Hatchback</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Bus">Bus</option>
                <option value="Rickshaw">Rickshaw</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Owner Name
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="Ali Khan"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Owner CNIC
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.ownerCNIC}
                onChange={(e) => setFormData({ ...formData, ownerCNIC: e.target.value })}
                placeholder="XXXXX-XXXXXXX-X"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
              Legal Status
            </label>
            <select
              className="input-field max-w-xs"
              value={formData.legalStatus}
              onChange={(e) => setFormData({ ...formData, legalStatus: e.target.value })}
            >
              <option value="clean">Clean</option>
              <option value="stolen">Stolen</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">
              {editingId ? "Update Vehicle" : "Register Vehicle"}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Vehicle List */}
      {loading ? (
        <p className="text-text-muted font-mono text-sm">Loading registry...</p>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-text-muted">
          {searchTerm ? "No vehicles match your search." : "No vehicles registered yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <div key={v._id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div>
                    <p className="font-mono text-lg tracking-wide">{v.plateNumber}</p>
                    <p className="text-sm text-text-muted">
                      {v.model} &middot; {v.color} {v.shape && `· ${v.shape}`}
                    </p>
                    {v.ownerName && (
                      <p className="text-xs text-text-muted mt-1">
                        Owner: {v.ownerName} {v.ownerCNIC && `(${v.ownerCNIC})`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono uppercase ${STATUS_STYLES[v.legalStatus]}`}>
                    {v.legalStatus}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-3 border-t border-borderline pt-3">
                <button
                  onClick={() => handleToggleStolen(v)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-colors ${
                    v.legalStatus === "clean"
                      ? "bg-alert-critical/10 text-alert-critical hover:bg-alert-critical/20"
                      : "bg-signal-teal/10 text-signal-teal hover:bg-signal-teal/20"
                  }`}
                >
                  {v.legalStatus === "clean" ? "Flag as Stolen" : "Mark as Clean"}
                </button>
                <button
                  onClick={() => handleEdit(v)}
                  className="text-xs px-3 py-1.5 rounded-lg font-mono bg-bg-raised text-text-muted hover:text-text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(v._id)}
                  className="text-xs px-3 py-1.5 rounded-lg font-mono text-alert-critical hover:bg-alert-critical/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProtectedVehiclesPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <VehiclesPage />
    </ProtectedRoute>
  );
}
