import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coordinates, calculateDistance } from "@/lib/geo";
import { Blockade, SafeRoute, mockBlockades, mockSafeRoutes } from "@/lib/mockData";
import {
  getSimulatedRoute,
  avoidBlockades,
  decodePolyline,
  SPEED_PAVED,
  SPEED_OFFROAD_DRIVE,
  SPEED_OFFROAD_WALK,
} from "@/lib/routing";

async function getBlockades(): Promise<Blockade[]> {
  try {
    const colRef = collection(db, "blockades");
    const snapshot = await getDocs(colRef);
    const blockades: Blockade[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      blockades.push({
        id: docSnap.id,
        name: data.name,
        type: data.type,
        location: data.location,
        radiusKm: data.radiusKm,
      });
    });
    return blockades.length ? blockades : mockBlockades;
  } catch (error) {
    console.error("Firestore blockades read failed, using mock data:", error);
    return mockBlockades;
  }
}

async function getSafeRoutes(): Promise<SafeRoute[]> {
  try {
    const colRef = collection(db, "safe_routes");
    const snapshot = await getDocs(colRef);
    const routes: SafeRoute[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      routes.push({
        id: docSnap.id,
        name: data.name,
        creatorName: data.creatorName,
        path: data.path,
        difficulty: data.difficulty,
        vehicleRequirements: data.vehicleRequirements,
        createdAt: data.createdAt,
        startPoint: data.startPoint,
        endPoint: data.endPoint,
      });
    });
    return routes.length ? routes : mockSafeRoutes;
  } catch (error) {
    console.error("Firestore safe routes read failed, using mock data:", error);
    return mockSafeRoutes;
  }
}

// Calls Google Maps Directions API
async function fetchGoogleDirections(
  start: Coordinates,
  end: Coordinates,
  apiKey: string
): Promise<{ polyline: Coordinates[]; distanceKm: number; durationMins: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      console.warn("Google Maps Directions API returned non-OK status:", data.status);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const encodedPolyline = route.overview_polyline.points;
    const decoded = decodePolyline(encodedPolyline).map(([lat, lng]) => ({ lat, lng }));

    return {
      polyline: decoded,
      distanceKm: leg.distance.value / 1000,
      durationMins: leg.duration.value / 60,
    };
  } catch (err) {
    console.error("Google Maps API request failed:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { start, end } = body;

    if (!start || typeof start.lat !== "number" || typeof start.lng !== "number" ||
        !end || typeof end.lat !== "number" || typeof end.lng !== "number") {
      return NextResponse.json({ success: false, error: "Invalid start or end coordinates." }, { status: 400 });
    }

    const blockades = await getBlockades();
    const safeRoutes = await getSafeRoutes();

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // If no API key is configured, fallback to simulation immediately
    if (!apiKey) {
      const simulated = getSimulatedRoute(start, end, blockades, safeRoutes);
      return NextResponse.json({
        success: true,
        source: "simulation",
        ...simulated,
      });
    }

    // ─── 1. Fetch Normal Google Directions ───
    // This will route from start to the nearest paved road point to the end.
    const googleNormalResult = await fetchGoogleDirections(start, end, apiKey);

    if (!googleNormalResult) {
      // Fallback to simulation if Google API fails or returns error
      const simulated = getSimulatedRoute(start, end, blockades, safeRoutes);
      return NextResponse.json({
        success: true,
        source: "simulation_fallback",
        ...simulated,
      });
    }

    const roadExitPoint = googleNormalResult.polyline[googleNormalResult.polyline.length - 1];

    // Standard paved route calculation
    const pavedTotalRoadDist = googleNormalResult.distanceKm;
    const walkDist = calculateDistance(roadExitPoint, end);
    const pavedDuration = googleNormalResult.durationMins + (walkDist / SPEED_OFFROAD_WALK) * 60;

    const pavedRouteResponse = {
      polyline: [...googleNormalResult.polyline, end],
      distanceKm: pavedTotalRoadDist + walkDist,
      durationMins: pavedDuration,
      pavedDistanceKm: pavedTotalRoadDist,
      walkDistanceKm: walkDist,
    };

    // ─── 2. Evaluate Aounak Dune Route ───
    // Option A: Road exit + off-road bypass
    const exitOffroadAvoidance = avoidBlockades(roadExitPoint, end, blockades);
    let exitOffroadDist = 0;
    for (let i = 0; i < exitOffroadAvoidance.path.length - 1; i++) {
      exitOffroadDist += calculateDistance(exitOffroadAvoidance.path[i], exitOffroadAvoidance.path[i + 1]);
    }
    const exitTime = googleNormalResult.durationMins + (exitOffroadDist / SPEED_OFFROAD_DRIVE) * 60;
    const exitPolyline = [...googleNormalResult.polyline, ...exitOffroadAvoidance.path.slice(1)];

    let bestAounakRoute = {
      polyline: exitPolyline,
      distanceKm: pavedTotalRoadDist + exitOffroadDist,
      durationMins: exitTime,
      pavedDistanceKm: pavedTotalRoadDist,
      offroadDistanceKm: exitOffroadDist,
      bypassed: exitOffroadAvoidance.bypassed,
      safeRouteUsed: null as string | null,
    };

    // Option B: Query Google Maps for nearby Safe Routes (limit to nearest 2 for quota/speed)
    const sortedSafeRoutes = [...safeRoutes].sort((a, b) => {
      const distA = calculateDistance(end, a.endPoint);
      const distB = calculateDistance(end, b.endPoint);
      return distA - distB;
    }).slice(0, 2);

    for (const sr of sortedSafeRoutes) {
      // Query google for directions to the start of this safe route
      const srPavedResult = await fetchGoogleDirections(start, sr.startPoint, apiKey);
      if (!srPavedResult) continue;

      // Safe route distance
      let srPathDist = 0;
      for (let i = 0; i < sr.path.length - 1; i++) {
        srPathDist += calculateDistance(sr.path[i], sr.path[i + 1]);
      }

      // Final leg from safe route end to actual incident (avoiding blockades)
      const finalLegAvoidance = avoidBlockades(sr.endPoint, end, blockades);
      let finalLegDist = 0;
      for (let i = 0; i < finalLegAvoidance.path.length - 1; i++) {
        finalLegDist += calculateDistance(finalLegAvoidance.path[i], finalLegAvoidance.path[i + 1]);
      }

      const srTotalOffroadDist = srPathDist + finalLegDist;
      const srTime = srPavedResult.durationMins + (srTotalOffroadDist / SPEED_OFFROAD_DRIVE) * 60;

      if (srTime < bestAounakRoute.durationMins) {
        // Construct the full hybrid coordinates path
        const fullPath: Coordinates[] = [...srPavedResult.polyline];
        sr.path.forEach((pt) => {
          const last = fullPath[fullPath.length - 1];
          if (!last || calculateDistance(last, pt) > 0.05) {
            fullPath.push(pt);
          }
        });
        finalLegAvoidance.path.slice(1).forEach((pt) => {
          fullPath.push(pt);
        });

        bestAounakRoute = {
          polyline: fullPath,
          distanceKm: srPavedResult.distanceKm + srTotalOffroadDist,
          durationMins: srTime,
          pavedDistanceKm: srPavedResult.distanceKm,
          offroadDistanceKm: srTotalOffroadDist,
          bypassed: finalLegAvoidance.bypassed,
          safeRouteUsed: sr.name,
        };
      }
    }

    return NextResponse.json({
      success: true,
      source: "google_maps_api",
      pavedRoute: pavedRouteResponse,
      aounakRoute: bestAounakRoute,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Routing API execution failed.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
