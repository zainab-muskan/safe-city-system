"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

// Fix Leaflet's default icon path issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons
const cameraIcon = new L.DivIcon({
  html: `<div style="background:#60a5fa;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #1e3a5f;font-size:14px;">📷</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  className: "",
});

const checkpointIcon = new L.DivIcon({
  html: `<div style="background:#00e5c7;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;border:3px solid #0a5c4d;font-size:14px;">🛡️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  className: "",
});

const threatIcon = new L.DivIcon({
  html: `<div style="background:#ff4757;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #8b0000;font-size:16px;animation:pulse 1.5s infinite;">🚨</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: "",
});

const THREAT_LABEL = {
  unregistered_plate: "Unregistered Plate",
  plate_vehicle_mismatch: "Plate Mismatch",
  stolen_flag: "Stolen Vehicle",
  citizen_report: "Citizen Report",
  manual_officer_alert: "Officer Alert",
};

export default function CityMap({ cameras = [], checkpoints = [], activeIncidents = [] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Calculate center from cameras/checkpoints or default to Rawalpindi
  const allCoords = [
    ...cameras.map((c) => c.location?.coordinates),
    ...checkpoints.map((c) => c.location?.coordinates),
  ].filter(Boolean);

  const center =
    allCoords.length > 0
      ? [
          allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length,
          allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length,
        ]
      : [33.6, 73.05]; // Default: Rawalpindi

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      {/* Dark themed map tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Camera markers */}
      {cameras.map((cam) => {
        if (!cam.location?.coordinates) return null;
        const [lng, lat] = cam.location.coordinates;
        return (
          <Marker key={cam._id} position={[lat, lng]} icon={cameraIcon}>
            <Popup>
              <div style={{ color: "#000", minWidth: 150 }}>
                <strong>📷 {cam.name}</strong>
                <br />
                <span style={{ fontSize: 12 }}>Direction: {cam.direction}</span>
                <br />
                <span style={{ fontSize: 12 }}>
                  Linked to: {cam.linkedCheckpoint?.name || "—"}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Checkpoint markers */}
      {checkpoints.map((cp) => {
        if (!cp.location?.coordinates) return null;
        const [lng, lat] = cp.location.coordinates;
        return (
          <Marker key={cp._id} position={[lat, lng]} icon={checkpointIcon}>
            <Popup>
              <div style={{ color: "#000", minWidth: 150 }}>
                <strong>🛡️ {cp.name}</strong>
                <br />
                <span style={{ fontSize: 12 }}>
                  Officers assigned: {cp.assignedOfficers?.length || 0}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Active threat markers — placed at the camera location where they were detected, or citizen report location */}
      {activeIncidents.map((inc) => {
        let lng, lat;
        
        if (inc.camera?.location?.coordinates) {
          [lng, lat] = inc.camera.location.coordinates;
        } else if (inc.citizenReportDetails?.coordinates?.length === 2) {
          [lng, lat] = inc.citizenReportDetails.coordinates;
        } else {
          return null; // No location to plot
        }
        
        // Slight offset to avoid stacking on camera pin
        const offset = Math.random() * 0.002 - 0.001;
        return (
          <div key={inc._id}>
            {/* Pulsing red circle behind the icon */}
            <Circle
              center={[lat + offset, lng + offset]}
              radius={200}
              pathOptions={{
                color: "#ff4757",
                fillColor: "#ff4757",
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
            <Marker position={[lat + offset, lng + offset]} icon={threatIcon}>
              <Popup>
                <div style={{ color: "#000", minWidth: 180 }}>
                  <div
                    style={{
                      background: "#ff4757",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontWeight: "bold",
                      fontSize: 12,
                      marginBottom: 6,
                      display: "inline-block",
                    }}
                  >
                    {THREAT_LABEL[inc.threatType] || inc.threatType}
                  </div>
                  <br />
                  <strong style={{ fontSize: 16, fontFamily: "monospace" }}>
                    {inc.detectedPlateText}
                  </strong>
                  <br />
                  <span style={{ fontSize: 12 }}>
                    {inc.detectedModel} · {inc.detectedColor}
                  </span>
                  <br />
                  <span style={{ fontSize: 12 }}>
                    Camera: {inc.camera.name}
                  </span>
                  {inc.matchedVehicle && (
                    <>
                      <hr style={{ margin: "6px 0", border: "1px solid #eee" }} />
                      <span style={{ fontSize: 11, color: "#666" }}>
                        Owner: {inc.matchedVehicle.ownerName}
                        <br />
                        Status:{" "}
                        <span
                          style={{
                            color:
                              inc.matchedVehicle.legalStatus === "stolen"
                                ? "#ff4757"
                                : "#2ed573",
                            fontWeight: "bold",
                          }}
                        >
                          {inc.matchedVehicle.legalStatus?.toUpperCase()}
                        </span>
                      </span>
                    </>
                  )}
                  <br />
                  <span style={{ fontSize: 10, color: "#999" }}>
                    {new Date(inc.createdAt).toLocaleString()}
                  </span>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </MapContainer>
  );
}
