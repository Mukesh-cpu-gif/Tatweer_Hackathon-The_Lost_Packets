import { Coordinates } from "./geo";
import { Blockade, SafeRoute } from "./mockData";

// Average speeds in km/h
export const SPEED_PAVED = 100;
export const SPEED_OFFROAD_DRIVE = 25;
export const SPEED_OFFROAD_WALK = 5; // Standard paved route ends at road, then passenger walks or slow towing

// Snaps coordinates to the local E95 highway longitude (55.485)
export function snapToHighway(coord: Coordinates): Coordinates {
  return {
    lat: coord.lat,
    lng: 55.485,
  };
}

// Flat-plane projection helpers for local geometry (accurate for Al Qua'a region)
export function toLocalXY(p: Coordinates, origin: Coordinates) {
  const latRad = (origin.lat * Math.PI) / 180;
  const x = (p.lng - origin.lng) * 111.32 * Math.cos(latRad);
  const y = (p.lat - origin.lat) * 110.57;
  return { x, y };
}

export function fromLocalXY(xy: { x: number; y: number }, origin: Coordinates): Coordinates {
  const latRad = (origin.lat * Math.PI) / 180;
  const lng = origin.lng + xy.x / (111.32 * Math.cos(latRad));
  const lat = origin.lat + xy.y / 110.57;
  return { lat, lng };
}

// Haversine distance calculator helper (calls geo's calculateDistance or local)
import { calculateDistance } from "./geo";

// Decodes a Google Maps encoded polyline string
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Bypasses blockade hazards by inserting waypoints around them
export function avoidBlockades(
  start: Coordinates,
  end: Coordinates,
  blockades: Blockade[]
): { path: Coordinates[]; bypassed: boolean } {
  let path: Coordinates[] = [start, end];
  let bypassed = false;

  // Run a few passes to ensure we bypass multiple blockades if they intersect
  for (let pass = 0; pass < 3; pass++) {
    let intersectionFound = false;
    const nextPath: Coordinates[] = [path[0]];

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];

      let segmentBypassed = false;
      let bypassPoint: Coordinates | null = null;

      for (const blk of blockades) {
        // Project onto a flat local space using blk.location as origin (0,0)
        const a = toLocalXY(p1, blk.location);
        const b = toLocalXY(p2, blk.location);
        const radius = blk.radiusKm;

        // Vector of segment
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const lenSq = vx * vx + vy * vy;

        if (lenSq === 0) continue;

        // Projection t of origin (0,0) onto segment A->B
        // Project vector from A to origin (which is -A) onto V
        const t = -(a.x * vx + a.y * vy) / lenSq;
        const tClamped = Math.max(0, Math.min(1, t));

        const closestX = a.x + tClamped * vx;
        const closestY = a.y + tClamped * vy;
        const dist = Math.sqrt(closestX * closestX + closestY * closestY);

        // If closest point is within the blockade radius
        if (dist < radius) {
          intersectionFound = true;
          segmentBypassed = true;
          bypassed = true;

          // Project bypass point outward perpendicular to the blockade center
          // If the closest point is exactly on center, project perpendicular to direction of travel
          let ux = 0;
          let uy = 0;

          if (dist > 0.001) {
            ux = closestX / dist;
            uy = closestY / dist;
          } else {
            const len = Math.sqrt(lenSq);
            ux = -vy / len;
            uy = vx / len;
          }

          // Bypass waypoint (radius + 150m buffer)
          const buffer = 0.15;
          const bypassLocal = {
            x: ux * (radius + buffer),
            y: uy * (radius + buffer),
          };

          bypassPoint = fromLocalXY(bypassLocal, blk.location);
          break;
        }
      }

      if (segmentBypassed && bypassPoint) {
        nextPath.push(bypassPoint);
        nextPath.push(p2);
      } else {
        nextPath.push(p2);
      }
    }

    path = nextPath;
    if (!intersectionFound) break;
  }

  return { path, bypassed };
}

// Simulated routing fallback model for Al Qua'a E95
export function getSimulatedRoute(
  start: Coordinates,
  end: Coordinates,
  blockades: Blockade[],
  safeRoutes: SafeRoute[]
) {
  const startSnapped = snapToHighway(start);
  const endSnapped = snapToHighway(end);

  // ─── 1. Paved-only route (Ends at nearest road point, passenger walks/tows) ───
  // Route: Start -> StartSnapped -> EndSnapped
  const pavedPolyline: Coordinates[] = [start];
  if (calculateDistance(start, startSnapped) > 0.1) pavedPolyline.push(startSnapped);
  if (calculateDistance(startSnapped, endSnapped) > 0.1) pavedPolyline.push(endSnapped);

  const pavedRoadDist = calculateDistance(start, startSnapped) + calculateDistance(startSnapped, endSnapped);
  const walkDist = calculateDistance(endSnapped, end);

  const pavedDuration = (pavedRoadDist / SPEED_PAVED) * 60 + (walkDist / SPEED_OFFROAD_WALK) * 60;
  const pavedTotalDist = pavedRoadDist + walkDist;

  // ─── 2. Aounak Hybrid Route ───
  // We evaluate:
  // A) Normal Highway Exit: Start -> StartSnapped -> EndSnapped -> (Off-road with bypass) -> End
  // B) Safe Routes: Start -> StartSnapped -> SafeRouteStart -> SafeRoutePath -> SafeRouteEnd -> (Off-road) -> End
  
  // Option A (Normal Exit)
  const exitOffroadAvoidance = avoidBlockades(endSnapped, end, blockades);
  const exitOffroadPath = exitOffroadAvoidance.path;
  let exitOffroadDist = 0;
  for (let i = 0; i < exitOffroadPath.length - 1; i++) {
    exitOffroadDist += calculateDistance(exitOffroadPath[i], exitOffroadPath[i + 1]);
  }
  const exitTotalPavedDist = calculateDistance(start, startSnapped) + calculateDistance(startSnapped, endSnapped);
  const exitTime = (exitTotalPavedDist / SPEED_PAVED) * 60 + (exitOffroadDist / SPEED_OFFROAD_DRIVE) * 60;
  const exitPolyline: Coordinates[] = [...pavedPolyline, ...exitOffroadPath.slice(1)];

  // Option B (Check all Safe Routes)
  let bestRouteOption = {
    time: exitTime,
    distance: exitTotalPavedDist + exitOffroadDist,
    pavedDist: exitTotalPavedDist,
    offroadDist: exitOffroadDist,
    polyline: exitPolyline,
    bypassed: exitOffroadAvoidance.bypassed,
    safeRouteUsed: null as string | null,
  };

  for (const sr of safeRoutes) {
    const srStartSnapped = snapToHighway(sr.startPoint);
    const pavedDistToSr = calculateDistance(start, startSnapped) + calculateDistance(startSnapped, srStartSnapped);
    
    // Path: start -> startSnapped -> srStartSnapped -> safeRoutePath -> safeRouteEnd -> end
    let srPathDist = 0;
    for (let i = 0; i < sr.path.length - 1; i++) {
      srPathDist += calculateDistance(sr.path[i], sr.path[i + 1]);
    }
    const finalLegAvoidance = avoidBlockades(sr.endPoint, end, blockades);
    let finalLegDist = 0;
    for (let i = 0; i < finalLegAvoidance.path.length - 1; i++) {
      finalLegDist += calculateDistance(finalLegAvoidance.path[i], finalLegAvoidance.path[i + 1]);
    }

    const srTotalPaved = pavedDistToSr;
    const srTotalOffroad = srPathDist + finalLegDist;
    const srTime = (srTotalPaved / SPEED_PAVED) * 60 + (srTotalOffroad / SPEED_OFFROAD_DRIVE) * 60;

    if (srTime < bestRouteOption.time) {
      const srPolyline: Coordinates[] = [start];
      if (calculateDistance(start, startSnapped) > 0.1) srPolyline.push(startSnapped);
      if (calculateDistance(startSnapped, srStartSnapped) > 0.1) srPolyline.push(srStartSnapped);
      
      // Add safe route path coordinates
      sr.path.forEach(pt => {
        // Avoid duplicate start point
        const last = srPolyline[srPolyline.length - 1];
        if (!last || calculateDistance(last, pt) > 0.05) {
          srPolyline.push(pt);
        }
      });

      // Add final leg coordinates (excluding duplicated start)
      finalLegAvoidance.path.slice(1).forEach(pt => {
        srPolyline.push(pt);
      });

      bestRouteOption = {
        time: srTime,
        distance: srTotalPaved + srTotalOffroad,
        pavedDist: srTotalPaved,
        offroadDist: srTotalOffroad,
        polyline: srPolyline,
        bypassed: finalLegAvoidance.bypassed,
        safeRouteUsed: sr.name,
      };
    }
  }

  return {
    pavedRoute: {
      polyline: pavedPolyline,
      distanceKm: pavedTotalDist,
      durationMins: pavedDuration,
      pavedDistanceKm: pavedRoadDist,
      walkDistanceKm: walkDist,
    },
    aounakRoute: {
      polyline: bestRouteOption.polyline,
      distanceKm: bestRouteOption.distance,
      durationMins: bestRouteOption.time,
      pavedDistanceKm: bestRouteOption.pavedDist,
      offroadDistanceKm: bestRouteOption.offroadDist,
      bypassed: bestRouteOption.bypassed,
      safeRouteUsed: bestRouteOption.safeRouteUsed,
    },
  };
}
