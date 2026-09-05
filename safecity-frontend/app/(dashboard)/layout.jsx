"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV_BY_ROLE = {
  super_admin: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Live Alerts", href: "/operator/alerts" },
    { label: "City Map", href: "/operator/map" },
    { label: "Vehicles", href: "/admin/vehicles" },
    { label: "Checkpoints", href: "/admin/checkpoints" },
    { label: "Cameras", href: "/admin/cameras" },
    { label: "Users", href: "/admin/users" },
  ],
  operator: [
    { label: "AI Alerts", href: "/operator/alerts" },
    { label: "City Map", href: "/operator/map" },
  ],
  checkpoint_officer: [
    { label: "My Checkpoint", href: "/checkpoint/alerts" },
    { label: "Plate Scanner", href: "/checkpoint/scanner" },
  ],
};

const ROLE_LABEL = {
  super_admin: "Super Admin",
  operator: "Control Room Operator",
  checkpoint_officer: "Checkpoint Officer",
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return children;

  const navItems = NAV_BY_ROLE[user.role] || [];

  return (
    <div className="min-h-screen bg-bg-deep flex overflow-hidden">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-borderline bg-bg-surface flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-borderline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-teal animate-pulseDot" />
            <span className="font-display font-semibold text-sm">Safe City</span>
          </div>
          <button className="md:hidden text-text-muted hover:text-text-primary" onClick={() => setIsSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
               <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-signal-teal/10 text-signal-teal border border-signal-teal/30"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-raised"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-borderline">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-text-muted font-mono">{ROLE_LABEL[user.role]}</p>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-muted hover:text-alert-critical hover:bg-alert-critical/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col min-h-screen">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden p-4 border-b border-borderline flex items-center gap-3 bg-bg-surface sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-text-muted hover:text-text-primary focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display font-semibold text-sm">Safe City</span>
        </div>
        
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
