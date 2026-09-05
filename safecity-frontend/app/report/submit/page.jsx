"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function PublicReportPage() {
  const [formData, setFormData] = useState({
    plateText: "",
    vehicleModel: "",
    vehicleColor: "",
    locationDetails: "",
    description: "",
    reporterName: "",
    reporterCnic: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await api.post("/incidents/public-report", formData);
      setSuccess(true);
      setFormData({
        plateText: "",
        vehicleModel: "",
        vehicleColor: "",
        locationDetails: "",
        description: "",
        reporterName: "",
        reporterCnic: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
        <div className="card max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-signal-teal/10 text-signal-teal rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-semibold mb-2">Report Submitted</h2>
          <p className="text-text-muted mb-6">
            Thank you for helping keep our city safe. Your report has been routed to the Control Room for immediate review.
          </p>
          <button onClick={() => setSuccess(false)} className="btn-primary w-full">
            Submit Another Report
          </button>
          <div className="mt-6">
            <Link href="/report" className="text-sm text-text-muted hover:text-text-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-signal-teal animate-pulseDot" />
            <span className="font-display font-semibold text-xl tracking-wide">Safe City</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
            Public Incident Report
          </h1>
          <p className="text-text-muted">
            Report stolen vehicles, accidents, or suspicious activity directly to the Control Room.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-alert-critical/10 border border-alert-critical/30 text-alert-critical p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-borderline pb-2">Vehicle Details</h3>
            
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Number Plate (Required)
              </label>
              <input
                required
                type="text"
                name="plateText"
                value={formData.plateText}
                onChange={handleChange}
                className="input-field font-mono text-lg uppercase"
                placeholder="ABC-123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                  Vehicle Model / Make
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Honda Civic"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                  Color
                </label>
                <input
                  type="text"
                  name="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Black"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium border-b border-borderline pb-2">Incident Details</h3>
            
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Location of Incident (Required)
              </label>
              <input
                required
                type="text"
                name="locationDetails"
                value={formData.locationDetails}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Near Centaurus Mall, Jinnah Avenue"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                Description of Incident (Required)
              </label>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="input-field"
                placeholder="Please describe what happened..."
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium border-b border-borderline pb-2">Your Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  name="reporterName"
                  value={formData.reporterName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ali Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5 uppercase">
                  CNIC Number
                </label>
                <input
                  type="text"
                  name="reporterCnic"
                  value={formData.reporterCnic}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? "Submitting Report..." : "Submit Report"}
            </button>
            <p className="text-xs text-text-muted text-center mt-4">
              False reporting is a punishable offense under the law.
            </p>
          </div>
        </form>

        <div className="mt-8 text-center">
          <Link href="/report" className="text-sm text-text-muted hover:text-text-primary underline">
            &larr; Back to Portal Home
          </Link>
        </div>
      </div>
    </div>
  );
}
