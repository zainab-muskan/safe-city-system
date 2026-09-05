"use client";

import { useState } from "react";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamic map for selecting location
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

export default function CitizenReportPage() {
  const [formData, setFormData] = useState({
    plateText: "",
    vehicleModel: "",
    vehicleColor: "",
    locationDetails: "",
    description: "",
    reporterName: "",
    reporterCnic: "",
  });
  const [coordinates, setCoordinates] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/incidents/public-report", {
        ...formData,
        coordinates, // [lng, lat] from map picker
        snapshotB64: photo, // Base64 image
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-signal-teal text-bg-base rounded-full flex items-center justify-center text-3xl mb-4">
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-2">Report Submitted</h1>
        <p className="text-text-muted mb-8 max-w-md">
          Thank you. Your report has been sent directly to the Safe City Command Center for immediate review.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setFormData({ plateText: "", vehicleModel: "", vehicleColor: "", locationDetails: "", description: "", reporterName: "", reporterCnic: "" });
            setPhoto(null);
            setCoordinates(null);
          }}
          className="btn-primary"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-3 mb-8 pb-6 border-b border-borderline">
          <Link href="/login" className="w-10 h-10 rounded-xl bg-signal-teal text-bg-base flex items-center justify-center font-bold text-xl cursor-pointer">
            SC
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold">Safe City Public Portal</h1>
            <p className="text-text-muted text-sm">Report a suspicious vehicle or incident</p>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-alert-critical/10 text-alert-critical border border-alert-critical/20 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-bg-surface p-6 rounded-2xl border border-borderline shadow-sm">
          
          {/* Photo Upload */}
          <section>
            <h2 className="text-lg font-semibold mb-4 border-b border-borderline pb-2 text-signal-teal">1. Photo Evidence</h2>
            <div className="flex flex-col items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-borderline border-dashed rounded-lg cursor-pointer bg-bg-raised hover:bg-borderline/50 transition-colors overflow-hidden">
                {photo ? (
                  <img src={photo} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="text-4xl mb-2">📸</span>
                    <p className="mb-2 text-sm font-semibold">Click to upload a photo</p>
                    <p className="text-xs text-text-muted">PNG, JPG or JPEG (Max 10MB)</p>
                  </div>
                )}
                <input id="dropzone-file" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              {photo && (
                <button type="button" onClick={() => setPhoto(null)} className="mt-2 text-xs text-alert-critical hover:underline">
                  Remove Photo
                </button>
              )}
            </div>
          </section>

          {/* Vehicle Details */}
          <section>
            <h2 className="text-lg font-semibold mb-4 border-b border-borderline pb-2 text-signal-teal">2. Vehicle Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">License Plate (if known)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. ABC-123"
                  value={formData.plateText}
                  onChange={(e) => setFormData({ ...formData, plateText: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Make / Model</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Honda Civic"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Black"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Location & Incident */}
          <section>
            <h2 className="text-lg font-semibold mb-4 border-b border-borderline pb-2 text-signal-teal">3. Location & Incident</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Pin Location on Map (Optional)</label>
              <p className="text-xs text-text-muted mb-2">Click on the map to mark where this happened.</p>
              <div className="h-64 rounded-xl overflow-hidden border border-borderline">
                <LocationPicker onLocationSelect={(coords) => setCoordinates(coords)} />
              </div>
              {coordinates && (
                <p className="text-xs text-signal-teal mt-1">✓ Location pinned</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Address / Landmark Details</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Near Saddar Metro Station"
                value={formData.locationDetails}
                onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">What happened? <span className="text-alert-critical">*</span></label>
              <textarea
                required
                className="input-field min-h-[100px]"
                placeholder="Describe the suspicious activity or incident..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </section>

          {/* Contact Details */}
          <section>
            <h2 className="text-lg font-semibold mb-4 border-b border-borderline pb-2 text-signal-teal">4. Your Details (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Your Name"
                  value={formData.reporterName}
                  onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CNIC / Phone</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contact info"
                  value={formData.reporterCnic}
                  onChange={(e) => setFormData({ ...formData, reporterCnic: e.target.value })}
                />
              </div>
            </div>
          </section>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg mt-8">
            {loading ? "Submitting..." : "Submit Report to Command Center"}
          </button>
        </form>
      </div>
    </div>
  );
}
