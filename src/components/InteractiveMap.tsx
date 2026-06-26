"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in Next.js
const defaultIcon = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown };
delete defaultIcon._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface MapResponder {
  id: number | string;
  name: string;
  location: { lat: number; lng: number };
  vehicleType: string;
}

interface InteractiveMapProps {
  routeType: "paved" | "dune";
  start: [number, number];
  end: [number, number];
  responders?: MapResponder[];
  endName?: string;
}

const isClient = typeof window !== "undefined";

// Custom glowing HTML markers
const userIcon = isClient
  ? new L.DivIcon({
      html: `<div class="w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white shadow-[0_0_12px_rgba(99,102,241,0.9)] animate-pulse"></div>`,
      className: "custom-div-icon",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })
  : undefined;

const stationIcon = isClient
  ? new L.DivIcon({
      html: `<div class="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-[0_0_12px_rgba(245,158,11,0.9)]"></div>`,
      className: "custom-div-icon",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })
  : undefined;

const responderIcon = isClient
  ? new L.DivIcon({
      html: `<div class="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_12px_rgba(16,185,129,0.9)]"></div>`,
      className: "custom-div-icon",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })
  : undefined;

// Helper component to recenter/fit map bounds automatically
function RecenterMap({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [bounds, map]);
  return null;
}

export default function InteractiveMap({ routeType, start, end, responders, endName }: InteractiveMapProps) {
  // CartoDB Dark Matter tiles matching dark mode stargazing theme
  const tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  const center: [number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
  ];

  // Path coordinates
  const pathCoordinates: [number, number][] =
    routeType === "paved"
      ? [start, [start[0] - 0.05, start[1] + 0.03], end]
      : [start, end];

  // Map bounds covering user, station, and responders
  const bounds = useMemo(() => {
    if (!isClient) return null;
    const list: L.LatLngExpression[] = [start, end];
    if (responders) {
      responders.forEach((r) => {
        list.push([r.location.lat, r.location.lng]);
      });
    }
    return L.latLngBounds(list);
  }, [start, end, responders]);

  const pathOptions =
    routeType === "dune"
      ? { color: "#fbbf24", weight: 3, dashArray: "5 5", lineCap: "round" as const }
      : { color: "#64748b", weight: 3, dashArray: "8 6" };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", minHeight: "100%" }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer url={tileUrl} />

        <Polyline positions={pathCoordinates} pathOptions={pathOptions} />

        {/* User Marker */}
        {userIcon && (
          <Marker position={start} icon={userIcon}>
            <Popup className="custom-popup">
              <div className="p-1 text-zinc-900 font-semibold text-xs">
                📍 Your Location (Stranded)
              </div>
            </Popup>
          </Marker>
        )}

        {/* ADNOC Station Marker */}
        {stationIcon && (
          <Marker position={end} icon={stationIcon}>
            <Popup className="custom-popup">
              <div className="p-1 text-zinc-900 font-semibold text-xs">
                ⛽ {endName || "Target Station"}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Responders Markers */}
        {responderIcon &&
          responders?.map((r) => (
            <Marker key={r.id} position={[r.location.lat, r.location.lng]} icon={responderIcon}>
              <Popup className="custom-popup">
                <div className="p-1.5 text-zinc-900 text-xs">
                  <p className="font-bold text-indigo-900 uppercase tracking-wide">Volunteer Dispatcher</p>
                  <p className="font-semibold mt-1">{r.name}</p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">{r.vehicleType}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {bounds && <RecenterMap bounds={bounds} />}
      </MapContainer>

      {routeType === "dune" && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/5 to-transparent z-[400]" />
      )}
    </div>
  );
}
