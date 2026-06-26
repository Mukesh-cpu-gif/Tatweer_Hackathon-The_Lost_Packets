import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface InteractiveMapProps {
  routeType: "paved" | "dune";
  start: [number, number];
  end: [number, number];
}

export default function InteractiveMap({ routeType, start, end }: InteractiveMapProps) {
  // We use CartoDB Dark Matter tiles for the dark theme
  const tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  // Calculate center between start and end
  const center: [number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
  ];

  // For the paved route, create a mock detour point to make the line curve
  // For the dune route, go straight
  const pathCoordinates: [number, number][] =
    routeType === "paved"
      ? [start, [start[0] - 0.05, start[1] + 0.03], end]
      : [start, end];

  // Custom styling for the lines
  const pathOptions =
    routeType === "dune"
      ? { color: "#fbbf24", weight: 4, dashArray: "1 0", lineCap: "round" as const }
      : { color: "#64748b", weight: 3, dashArray: "8 6" };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", minHeight: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={tileUrl} />

        <Polyline positions={pathCoordinates} pathOptions={pathOptions} />

        {/* Start Marker */}
        <Marker position={start}>
          <Popup className="bg-slate-800 border-none text-white rounded">
            <strong>Responder Location</strong>
          </Popup>
        </Marker>

        {/* End Marker */}
        <Marker position={end}>
          <Popup className="bg-slate-800 border-none text-white rounded">
            <strong>Incident Location (SOS)</strong>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Overlay for glow effect on dune route */}
      {routeType === "dune" && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/5 to-transparent z-[400]" />
      )}
    </div>
  );
}
