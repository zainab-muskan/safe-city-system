"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Wrap any page with this to require login, optionally restricted to
// specific roles: <ProtectedRoute allowedRoles={["super_admin"]}>...</ProtectedRoute>
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const roleMismatch = user && allowedRoles && !allowedRoles.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (roleMismatch) {
      router.push("/login");
    }
  }, [user, loading, roleMismatch, router]);

  // Block rendering entirely until we know the user is both logged in AND
  // allowed on this page — otherwise the page's own effects (API calls)
  // fire before the redirect completes, causing a 403 flash.
  if (loading || !user || roleMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="flex items-center gap-3 text-text-muted font-mono text-sm">
          <span className="h-2 w-2 rounded-full bg-signal-teal animate-pulseDot" />
          Verifying session...
        </div>
      </div>
    );
  }

  return children;
}