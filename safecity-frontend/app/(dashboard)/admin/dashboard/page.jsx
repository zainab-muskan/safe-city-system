"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";

const THREAT_LABELS = {
  stolen_flag: "Stolen Vehicle",
  unregistered_plate: "Unregistered Plate",
  plate_vehicle_mismatch: "Plate Mismatch",
  citizen_report: "Citizen Report",
};

const THREAT_COLORS = {
  stolen_flag: "bg-alert-critical/10 text-alert-critical border-alert-critical/30",
  unregistered_plate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  plate_vehicle_mismatch: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  citizen_report: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

const STATUS_LABELS = {
  pending_review: "Pending",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  resolved: "Resolved",
  false_positive: "Dismissed",
};

const STATUS_COLORS = {
  pending_review: "text-amber-400",
  confirmed: "text-blue-400",
  dispatched: "text-purple-400",
  resolved: "text-signal-teal",
  false_positive: "text-text-muted",
};

function StatCard({ label, value, accent, subtitle, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card p-5 ${onClick ? "cursor-pointer hover:border-signal-teal/40 transition-colors" : ""}`}
    >
      <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-display font-bold ${accent || "text-text-primary"}`}>{value}</p>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/stats");
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const generatePDF = () => {
    import("jspdf").then(({ default: jsPDF }) => {
      import("jspdf-autotable").then(({ default: autoTable }) => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(30, 58, 95); // Safe City brand color
        doc.text("Safe City Command Center", 14, 22);
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Daily Security Briefing - ${new Date().toLocaleDateString()}`, 14, 30);
        
        // Summary Stats
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Network Overview", 14, 45);
        
        autoTable(doc, {
          startY: 50,
          head: [["Metric", "Count"]],
          body: [
            ["Total AI Detections", stats.incidents.total],
            ["Stolen Vehicles Intercepted", stats.incidents.confirmed + stats.incidents.dispatched + stats.incidents.resolved],
            ["False Positives", stats.incidents.falsePositives],
            ["Vehicles in Registry", stats.vehicles.total],
            ["Active Cameras", stats.infrastructure.cameras],
            ["Active Checkpoints", stats.infrastructure.checkpoints],
          ],
          theme: "striped",
          headStyles: { fillColor: [46, 213, 115] },
        });

        // Threat Breakdown
        doc.text("Threat Breakdown", 14, doc.lastAutoTable.finalY + 15);
        const breakdownData = stats.threatBreakdown.map((t) => [
          THREAT_LABELS[t._id] || t._id,
          t.count,
        ]);
        
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Threat Category", "Total Incidents"]],
          body: breakdownData.length > 0 ? breakdownData : [["No data", "0"]],
          theme: "striped",
          headStyles: { fillColor: [30, 58, 95] },
        });

        // Recent Incidents
        doc.text("Recent Activity Log", 14, doc.lastAutoTable.finalY + 15);
        const recentData = stats.recentIncidents.map((inc) => [
          new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          inc.detectedPlateText,
          THREAT_LABELS[inc.threatType] || inc.threatType,
          inc.camera?.name || "Unknown",
          inc.status.replace("_", " "),
        ]);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Time", "Plate", "Threat", "Location", "Status"]],
          body: recentData.length > 0 ? recentData : [["No recent incidents", "-", "-", "-", "-"]],
          theme: "striped",
          headStyles: { fillColor: [255, 71, 87] },
        });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated automatically by Safe City AI on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);

        doc.save(`SafeCity_Briefing_${new Date().toISOString().split("T")[0]}.pdf`);
      });
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-text-muted font-mono text-sm animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-alert-critical font-mono text-sm">Failed to load statistics.</p>
      </div>
    );
  }

  const { incidents, vehicles, infrastructure, threatBreakdown, recentIncidents } = stats;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-signal-teal animate-pulseDot" />
            <h1 className="text-2xl font-display font-semibold">Command Center</h1>
          </div>
          <p className="text-text-muted text-sm">
            Real-time overview of the Safe City surveillance network.
          </p>
        </div>
        <button 
          onClick={generatePDF}
          className="btn-primary flex items-center gap-2"
        >
          <span>📄</span> Download Security Briefing
        </button>
      </div>

      {/* Primary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Incidents"
          value={incidents.total}
          accent="text-text-primary"
        />
        <StatCard
          label="Pending Review"
          value={incidents.pending}
          accent="text-amber-400"
          onClick={() => router.push("/operator/alerts")}
          subtitle="Click to review →"
        />
        <StatCard
          label="Dispatched"
          value={incidents.dispatched}
          accent="text-purple-400"
        />
        <StatCard
          label="Resolved"
          value={incidents.resolved}
          accent="text-signal-teal"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Registered Vehicles"
          value={vehicles.total}
          onClick={() => router.push("/admin/vehicles")}
          subtitle="Click to manage →"
        />
        <StatCard
          label="Stolen Flagged"
          value={vehicles.stolen}
          accent="text-alert-critical"
        />
        <StatCard
          label="Active Cameras"
          value={infrastructure.cameras}
          onClick={() => router.push("/admin/cameras")}
          subtitle="Click to manage →"
        />
        <StatCard
          label="Checkpoints"
          value={infrastructure.checkpoints}
          onClick={() => router.push("/admin/checkpoints")}
          subtitle={`${infrastructure.officers} officers deployed`}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
            Threat Breakdown
          </h2>
          {threatBreakdown.length === 0 ? (
            <p className="text-text-muted text-sm">No incidents recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {threatBreakdown.map((t) => {
                const pct = incidents.total > 0 ? Math.round((t.count / incidents.total) * 100) : 0;
                return (
                  <div key={t._id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${THREAT_COLORS[t._id] || "text-text-muted"}`}>
                        {THREAT_LABELS[t._id] || t._id}
                      </span>
                      <span className="text-sm font-mono text-text-muted">
                        {t.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-bg-deep rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-signal-teal/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Incidents Feed */}
        <div className="card p-5">
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
            Recent Activity
          </h2>
          {recentIncidents.length === 0 ? (
            <p className="text-text-muted text-sm">No recent incidents.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentIncidents.map((inc) => (
                <div
                  key={inc._id}
                  className="flex items-start justify-between p-3 rounded-lg bg-bg-deep/50 border border-borderline"
                >
                  <div>
                    <p className="font-mono text-sm">{inc.detectedPlateText}</p>
                    <p className="text-xs text-text-muted">
                      {inc.camera?.name || "Citizen Report"} &middot;{" "}
                      {new Date(inc.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${THREAT_COLORS[inc.threatType] || "text-text-muted"}`}>
                      {THREAT_LABELS[inc.threatType] || inc.threatType}
                    </span>
                    <p className={`text-xs font-mono mt-1 ${STATUS_COLORS[inc.status]}`}>
                      {STATUS_LABELS[inc.status]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute allowedRoles={["super_admin", "operator"]}>
      <DashboardPage />
    </ProtectedRoute>
  );
}
