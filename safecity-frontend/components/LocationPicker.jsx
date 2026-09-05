"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";

// Fix Leaflet's default icon path issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const pinIcon = new L.DivIcon({
  html: `<div style="background:#ff4757;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);">📍</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  className: "",
});

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lng, e.latlng.lat]);
    },
  });
  return null;
}

export default function LocationPicker({ onLocationSelect }) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState(null); // [lng, lat]

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSelect = (coords) => {
    setPosition(coords);
    onLocationSelect(coords);
  };

  return (
    <MapContainer
      center={[33.6, 73.05]} // Default to Rawalpindi
      zoom={12}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MapClickHandler onSelect={handleSelect} />
      {position && <Marker position={[position[1], position[0]]} icon={pinIcon} />}
    </MapContainer>
  );
}
