"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

import ProtectedRoute from "@/components/ProtectedRoute";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deactivateUser = async (id) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await api.patch(`/users/${id}/deactivate`);
      fetchUsers();
    } catch (err) {
      alert("Failed to deactivate user");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">Users</h1>
          <p className="text-text-muted text-sm mt-1">Manage system access and roles</p>
        </div>
        <Link href="/admin/users/create" className="btn-primary">
          + New Account
        </Link>
      </div>

      {error && (
        <div className="bg-alert-critical/10 border border-alert-critical/30 text-alert-critical p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-text-muted">Loading users...</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-borderline bg-bg-surface">
                <th className="p-4 text-xs font-mono font-medium text-text-muted uppercase">Name</th>
                <th className="p-4 text-xs font-mono font-medium text-text-muted uppercase">Email</th>
                <th className="p-4 text-xs font-mono font-medium text-text-muted uppercase">Role</th>
                <th className="p-4 text-xs font-mono font-medium text-text-muted uppercase">Status</th>
                <th className="p-4 text-xs font-mono font-medium text-text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderline">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-bg-surface transition-colors">
                  <td className="p-4 text-sm font-medium">{u.name}</td>
                  <td className="p-4 text-sm text-text-muted">{u.email}</td>
                  <td className="p-4 text-sm font-mono capitalize">
                    {u.role.replace("_", " ")}
                  </td>
                  <td className="p-4 text-sm">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-signal-teal/10 text-signal-teal">
                        <span className="w-1.5 h-1.5 rounded-full bg-signal-teal"></span> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-alert-critical/10 text-alert-critical">
                        <span className="w-1.5 h-1.5 rounded-full bg-alert-critical"></span> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    {u.isActive && (
                      <button
                        onClick={() => deactivateUser(u._id)}
                        className="text-alert-critical hover:underline text-xs"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-text-muted text-sm">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProtectedUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <UsersPage />
    </ProtectedRoute>
  );
}
