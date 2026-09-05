"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

import ProtectedRoute from "@/components/ProtectedRoute";

function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "operator",
    assignedCheckpoint: "",
  });
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch checkpoints for the dropdown if we need to assign a checkpoint officer
    const fetchCheckpoints = async () => {
      try {
        const { data } = await api.get("/checkpoints");
        setCheckpoints(data);
      } catch (err) {
        console.error("Failed to load checkpoints", err);
      }
    };
    fetchCheckpoints();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Create user
      const payload = { ...formData };
      if (payload.role !== "checkpoint_officer") {
        delete payload.assignedCheckpoint;
      }

      await api.post("/auth/register", payload);
      router.push("/admin/users");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/users" className="text-text-muted hover:text-text-primary text-sm mb-2 inline-block">
          &larr; Back to Users
        </Link>
        <h1 className="text-2xl font-display font-semibold text-text-primary">Create New Account</h1>
        <p className="text-text-muted text-sm mt-1">Register a new user in the system</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="bg-alert-critical/10 border border-alert-critical/30 text-alert-critical p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase tracking-wide">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Officer Ali"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="ali@safecity.pk"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase tracking-wide">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
            >
              <option value="operator">Control Room Operator</option>
              <option value="checkpoint_officer">Checkpoint Officer</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {formData.role === "checkpoint_officer" && (
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase tracking-wide">
                Assign Checkpoint
              </label>
              <select
                name="assignedCheckpoint"
                required
                value={formData.assignedCheckpoint}
                onChange={handleChange}
                className="input-field"
              >
                <option value="" disabled>Select a checkpoint</option>
                {checkpoints.map((cp) => (
                  <option key={cp._id} value={cp._id}>
                    {cp.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-borderline">
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProtectedCreateUserPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <CreateUserPage />
    </ProtectedRoute>
  );
}
