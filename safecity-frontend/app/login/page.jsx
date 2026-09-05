"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to sign in. Check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient grid backdrop, evoking a monitoring/surveillance grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#00D9C0 1px, transparent 1px), linear-gradient(90deg, #00D9C0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="h-2 w-2 rounded-full bg-signal-teal animate-pulseDot" />
          <span className="font-mono text-xs tracking-widest text-signal-teal uppercase">
            System Online
          </span>
        </div>

        <h1 className="text-3xl font-display font-semibold text-center mb-1">
          Safe City
        </h1>
        <p className="text-text-muted text-center text-sm mb-8">
          Vehicle Recognition & Threat Dispatch
        </p>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@safecity.pk"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-alert-critical text-sm font-mono bg-alert-critical/10 border border-alert-critical/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-text-muted text-xs mt-6 font-mono">
          Access is role-based. Contact your Admin for credentials.
        </p>

        <div className="mt-8 pt-6 border-t border-borderline text-center">
          <p className="text-text-muted text-sm mb-2">Are you a citizen reporting an incident?</p>
          <Link href="/report" className="text-signal-teal hover:underline text-sm font-medium">
            Go to Public Reporting Portal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
