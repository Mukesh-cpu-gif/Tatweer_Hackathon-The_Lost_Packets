"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { calculateDistance } from "@/lib/geo";
import { mockResponders } from "@/lib/mockData";
import MapWrapper from "@/components/MapWrapper";
import { Fuel, Navigation, Compass, Maximize2, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Station {
  id: string;
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
}

const ADNOC_STATIONS: Station[] = [
  { id: "al_quaa_946", name: "ADNOC Al Quaa (946)", nameAr: "أدنوك القوع", lat: 23.3138, lng: 55.1080 },
  { id: "al_wagan_980", name: "ADNOC Al Wagan (980)", nameAr: "أدنوك الوقن", lat: 23.6260, lng: 55.3560 },
  { id: "al_arad_950", name: "ADNOC Al Arad (950)", nameAr: "أدنوك العراد", lat: 23.8120, lng: 55.4520 },
];

function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function getCompassDirection(bearing: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

interface FuelCalculatorProps {
  coordinates: { lat: number; lng: number } | null;
  onChange: (info: string) => void;
}

const FALLBACK_COORDS = { lat: 23.543, lng: 55.487 };

export default function FuelCalculator({ coordinates, onChange }: FuelCalculatorProps) {
  const { t, isAr } = useLanguage();

  // Use stable fallback coordinates if GPS coords are not loaded yet
  const activeCoords = coordinates || FALLBACK_COORDS;
  const activeLat = activeCoords.lat;
  const activeLng = activeCoords.lng;

  // Hydration safety flag
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Calculate stats for all stations (compare using primitive values for stability)
  const stationsWithDistance = useMemo(() => {
    const currentCoords = { lat: activeLat, lng: activeLng };
    return ADNOC_STATIONS.map((station) => {
      const distance = calculateDistance(currentCoords, station);
      const bearing = calculateBearing(activeLat, activeLng, station.lat, station.lng);
      const direction = getCompassDirection(bearing);
      return {
        ...station,
        distance,
        bearing,
        direction,
      };
    }).sort((a, b) => a.distance - b.distance);
  }, [activeLat, activeLng]);

  // States
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const selectedStation = useMemo(() => {
    if (stationsWithDistance.length === 0) return null;
    const match = stationsWithDistance.find((s) => s.id === selectedStationId);
    return match || stationsWithDistance[0];
  }, [stationsWithDistance, selectedStationId]);
  const [fuelEconomyInput, setFuelEconomyInput] = useState<string>("10");
  const [fuelEconomyUnit, setFuelEconomyUnit] = useState<"km_l" | "l_100km">("km_l");
  const [fuelType, setFuelType] = useState<string>("Special 95");
  const [safetyBuffer, setSafetyBuffer] = useState<number>(5);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Compass real-time device orientation listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if ("webkitCompassHeading" in e) {
        const heading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
        if (typeof heading === "number") {
          setDeviceHeading(heading);
          return;
        }
      }
      if (e.absolute && e.alpha !== null) {
        const heading = (360 - e.alpha) % 360;
        setDeviceHeading(heading);
      }
    };

    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if ("ondeviceorientationabsolute" in win) {
        win.addEventListener("deviceorientationabsolute", handleOrientation, true);
      } else if ("ondeviceorientation" in win) {
        win.addEventListener("deviceorientation", handleOrientation, true);
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        win.removeEventListener("deviceorientationabsolute", handleOrientation, true);
        win.removeEventListener("deviceorientation", handleOrientation, true);
      }
    };
  }, []);

  // Compute 3 nearest active responders relative to stranded user
  const nearestResponders = useMemo(() => {
    const currentCoords = { lat: activeLat, lng: activeLng };
    return mockResponders
      .filter((r) => r.available)
      .map((r) => {
        const distance = calculateDistance(currentCoords, r.location);
        return { ...r, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map((r) => ({
        id: r.id,
        name: r.name,
        location: r.location,
        vehicleType: r.vehicleType,
      }));
  }, [activeLat, activeLng]);

  // Automatically update selected station if the computed list changes, preventing cycles
  // Automatically update selected station is now handled purely and reactively via useMemo derivation.

  const fuelEconomyNumber = parseFloat(fuelEconomyInput) || 10;

  const economyInKmL = useMemo(() => {
    if (fuelEconomyUnit === "km_l") {
      return fuelEconomyNumber > 0 ? fuelEconomyNumber : 10;
    } else {
      return fuelEconomyNumber > 0 ? 100 / fuelEconomyNumber : 10;
    }
  }, [fuelEconomyInput, fuelEconomyUnit, fuelEconomyNumber]);

  const calculatedVolume = useMemo(() => {
    if (!selectedStation) return 0;
    const baseFuel = selectedStation.distance / economyInKmL;
    return baseFuel + safetyBuffer;
  }, [selectedStation, economyInKmL, safetyBuffer]);

  const summaryText = useMemo(() => {
    if (!selectedStation) return "";
    const stationName = isAr ? selectedStation.nameAr : selectedStation.name;
    const fuelTypeLabel = t(fuelType);
    if (isAr) {
      return `طلب وقود: ${calculatedVolume.toFixed(1)} لتر من ${fuelTypeLabel} (المحطة: ${stationName}، على بعد ${selectedStation.distance.toFixed(1)} كم، الاتجاه: ${selectedStation.direction})`;
    }
    return `Request: ${calculatedVolume.toFixed(1)}L of ${fuelType} (Target: ${selectedStation.name}, ${selectedStation.distance.toFixed(1)}km away, Bearing: ${selectedStation.direction})`;
  }, [selectedStation, calculatedVolume, fuelType, isAr, t]);

  useEffect(() => {
    onChange(summaryText);
  }, [summaryText, onChange]);

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none" />
      <CardHeader className="pb-3 border-b border-zinc-800/50">
        <CardTitle className="flex items-center gap-2 text-slate-200 text-sm font-bold tracking-widest uppercase">
          <Fuel size={18} className="text-indigo-400" />
          {t("Fuel Calculator & Station Finder")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("Locate actual ADNOC stations and compute exact emergency fuel requirements.")}
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* ── Section 1: Nearest ADNOC Stations ────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase flex items-center justify-between">
            <span>{t("Nearest ADNOC Stations")}</span>
            {deviceHeading !== null ? (
              <Badge variant="outline" className="bg-emerald-950/40 border-emerald-500/30 text-emerald-400 text-[8px] font-bold uppercase tracking-wider animate-pulse h-5 flex items-center">
                {t("Compass Active")}
              </Badge>
            ) : (
              <span className="text-[10px] text-zinc-500 italic">{t("Relative to your position")}</span>
            )}
          </label>
          <div className="space-y-2">
            {stationsWithDistance.map((station) => {
              const isSelected = selectedStation?.id === station.id;
              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => setSelectedStationId(station.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                      : "bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border transition-all ${
                       isSelected ? "bg-indigo-600/30 border-indigo-500/30" : "bg-zinc-900 border-zinc-800"
                    }`}>
                      <Navigation
                        size={16}
                        className={`transition-transform duration-700 ${
                          isSelected ? "text-indigo-300" : "text-zinc-500"
                        }`}
                        style={
                          mounted
                            ? {
                                transform: `rotate(${
                                  deviceHeading !== null
                                    ? station.bearing - deviceHeading - 45
                                    : station.bearing - 45
                                }deg)`,
                              }
                            : undefined
                        }
                      />
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-bold tracking-wide uppercase ${
                        isSelected ? "text-indigo-200" : "text-zinc-300"
                      }`}>
                        {isAr ? station.nameAr : station.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {isAr ? station.name : station.nameAr} · {t("Direction:")} {station.direction} ({station.bearing.toFixed(0)}°)
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-bold tracking-widest uppercase border ${
                    isSelected ? "bg-indigo-950/30 border-indigo-500/30 text-indigo-300" : "border-zinc-800 text-zinc-400"
                  }`}>
                    {station.distance.toFixed(1)} {isAr ? "كم" : "km"}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Section 2: Fuel Economy Input ────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="fuel-economy" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
              {t("Fuel Economy")}
            </label>
            <Input
              id="fuel-economy"
              type="number"
              min="0.1"
              step="any"
              value={fuelEconomyInput}
              onChange={(e) => setFuelEconomyInput(e.target.value)}
              className="bg-zinc-950/50 border-zinc-800 focus-visible:border-indigo-500 text-zinc-200 font-medium placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
              {t("Economy Unit")}
            </label>
            <div className="grid grid-cols-2 bg-zinc-950/50 border border-zinc-800 rounded-lg p-0.5 h-8.5 items-center">
              <button
                type="button"
                onClick={() => setFuelEconomyUnit("km_l")}
                className={`text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-md transition-all ${
                  fuelEconomyUnit === "km_l"
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                km/L
              </button>
              <button
                type="button"
                onClick={() => setFuelEconomyUnit("l_100km")}
                className={`text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-md transition-all ${
                  fuelEconomyUnit === "l_100km"
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                L/100km
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 3: Fuel Type Selection ───────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">{t("Fuel Type Needed")}</label>
          <div className="grid grid-cols-3 gap-2">
            {["Special 95", "Super 98", "Diesel"].map((type) => {
              const isSelected = fuelType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFuelType(type)}
                  className={`text-[10px] font-bold tracking-widest uppercase py-2 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]"
                      : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {t(type)}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Section 4: Safety Buffer Slider ─────────────────── */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-zinc-400 tracking-wider uppercase">{t("Safety Buffer (Liters)")}</label>
            <span className="font-mono font-bold text-indigo-300 bg-indigo-950/30 border border-indigo-500/20 px-2 py-0.5 rounded">
              +{safetyBuffer} {isAr ? "لتر" : "Litres"}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={safetyBuffer}
            onChange={(e) => setSafetyBuffer(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-zinc-800 accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* ── Section 5: Computed Calculation Summary ─────────── */}
        {selectedStation && calculatedVolume > 0 && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3.5 space-y-2.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">{t("Recommended Supply")}</p>
                <p className="text-xl font-extrabold text-zinc-100 mt-1">
                  {calculatedVolume.toFixed(1)} <span className="text-sm font-semibold text-zinc-400">{isAr ? "لتر" : "Liters"}</span>
                </p>
              </div>
              <Badge className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold tracking-widest uppercase">
                {t(fuelType)}
              </Badge>
            </div>
            <div className="text-[11px] text-zinc-400 leading-relaxed pt-2 border-t border-zinc-800/60">
              {isAr ? (
                <>
                  للوصول إلى <strong className="text-zinc-200">{selectedStation.nameAr}</strong> (على بعد {selectedStation.distance.toFixed(1)} كم، بموقع اتجاه {selectedStation.direction})، ستحتاج حوالي {(selectedStation.distance / economyInKmL).toFixed(1)} لتر من الوقود بناءً على كفاءة استهلاكك للوقود البالغة {fuelEconomyInput} {fuelEconomyUnit === "km_l" ? "كم/لتر" : "لتر/100كم"}. قمنا بإضافة {safetyBuffer} لتر كهامش أمان.
                </>
              ) : (
                <>
                  To reach <strong className="text-zinc-200">{selectedStation.name}</strong> ({selectedStation.distance.toFixed(1)} km away, Heading {selectedStation.direction}), you need ~{(selectedStation.distance / economyInKmL).toFixed(1)}L of fuel based on your {fuelEconomyInput} {fuelEconomyUnit === "km_l" ? "km/L" : "L/100km"} fuel economy. We added a {safetyBuffer}L buffer.
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Section 6: Real-time Route Map ─────────────────── */}
        {selectedStation && (
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase flex items-center justify-between">
              <span>{t("Route & Response Preview")}</span>
              <span className="text-[9px] text-zinc-500 uppercase font-medium">{t("Volunteers Plotted")}</span>
            </label>
            <div className="h-44 w-full rounded-xl overflow-hidden border border-zinc-800/80 relative z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] group/map">
              <MapWrapper
                routeType="dune"
                start={[activeCoords.lat, activeCoords.lng]}
                end={[selectedStation.lat, selectedStation.lng]}
                responders={nearestResponders}
                endName={isAr ? selectedStation.nameAr : selectedStation.name}
              />
              
              {/* Maximize Button Overlay */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="absolute top-2.5 right-2.5 z-[500] p-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors shadow-lg"
                title={t("Fullscreen Mode")}
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Fullscreen Map Portal Overlay ─────────────────── */}
        {isFullscreen && selectedStation && (
          <div className="fixed inset-0 z-[9999] bg-zinc-950/95 flex flex-col p-6 space-y-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-zinc-100 tracking-wide uppercase flex items-center gap-2">
                  <Compass size={18} className="text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />
                  {t("Tactical Navigation Grid")}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t("Target:")} {isAr ? selectedStation.nameAr : selectedStation.name} · {t("Showing 3 Nearest Rescue Volunteers")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all h-10 w-10 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-grow w-full rounded-2xl overflow-hidden border border-zinc-800/80 relative z-0 shadow-2xl">
              <MapWrapper
                routeType="dune"
                start={[activeCoords.lat, activeCoords.lng]}
                end={[selectedStation.lat, selectedStation.lng]}
                responders={nearestResponders}
                endName={isAr ? selectedStation.nameAr : selectedStation.name}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-zinc-500 py-1 bg-zinc-900/40 px-4 rounded-xl border border-zinc-800/30">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-[0_0_6px_#6366f1]"></span> {t("Your Location")}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_6px_#f59e0b]"></span> {t("ADNOC Station")}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]"></span> {t("Nearest Responders")}</span>
              </div>
              <span className="font-mono tracking-widest uppercase text-[10px]">{t("Al Qua'a Response Grid")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
