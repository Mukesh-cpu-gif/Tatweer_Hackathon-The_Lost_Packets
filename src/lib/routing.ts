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

// Predefined GPS trace for E95 highway in the Al Qua'a region
const E95_PATH: Coordinates[] = [
  { lat: 23.680, lng: 55.518 },
  { lat: 23.650, lng: 55.508 },
  { lat: 23.600, lng: 55.494 },
  { lat: 23.570, lng: 55.488 },
  { lat: 23.540, lng: 55.484 },
  { lat: 23.510, lng: 55.481 },
  { lat: 23.470, lng: 55.476 },
  { lat: 23.430, lng: 55.472 },
  { lat: 23.380, lng: 55.467 },
];

export function getHighwaySegment(start: Coordinates, end: Coordinates): Coordinates[] {
  let startIdx = 0;
  let minDistStart = Infinity;
  for (let i = 0; i < E95_PATH.length; i++) {
    const d = calculateDistance(start, E95_PATH[i]);
    if (d < minDistStart) {
      minDistStart = d;
      startIdx = i;
    }
  }

  let endIdx = 0;
  let minDistEnd = Infinity;
  for (let i = 0; i < E95_PATH.length; i++) {
    const d = calculateDistance(end, E95_PATH[i]);
    if (d < minDistEnd) {
      minDistEnd = d;
      endIdx = i;
    }
  }

  const segment: Coordinates[] = [];
  const step = startIdx < endIdx ? 1 : -1;
  for (let i = startIdx; i !== endIdx + step; i += step) {
    segment.push(E95_PATH[i]);
  }
  return segment;
}

export function getSimulatedRoute(
  start: Coordinates,
  end: Coordinates,
  blockades: Blockade[],
  safeRoutes: SafeRoute[]
) {
  const highwaySegment = getHighwaySegment(start, end);
  const roadEntrancePoint = highwaySegment[0];
  const roadExitPoint = highwaySegment[highwaySegment.length - 1];

  // ─── 1. Paved-only route (Ends at nearest road point, passenger walks/tows) ───
  const pavedPolyline: Coordinates[] = [];
  pavedPolyline.push(start);
  if (calculateDistance(start, roadEntrancePoint) > 0.1) {
    pavedPolyline.push(roadEntrancePoint);
  }
  for (let i = 1; i < highwaySegment.length; i++) {
    pavedPolyline.push(highwaySegment[i]);
  }

  let pavedRoadDist = calculateDistance(start, roadEntrancePoint);
  for (let i = 0; i < highwaySegment.length - 1; i++) {
    pavedRoadDist += calculateDistance(highwaySegment[i], highwaySegment[i + 1]);
  }
  
  const walkDist = calculateDistance(roadExitPoint, end);
  const pavedDuration = (pavedRoadDist / SPEED_PAVED) * 60 + (walkDist / SPEED_OFFROAD_WALK) * 60;
  const pavedTotalDist = pavedRoadDist + walkDist;

  // ─── 2. Aounak Hybrid Route ───
  const exitOffroadAvoidance = avoidBlockades(roadExitPoint, end, blockades);
  const exitOffroadPath = exitOffroadAvoidance.path;
  let exitOffroadDist = 0;
  for (let i = 0; i < exitOffroadPath.length - 1; i++) {
    exitOffroadDist += calculateDistance(exitOffroadPath[i], exitOffroadPath[i + 1]);
  }
  
  const exitTime = (pavedRoadDist / SPEED_PAVED) * 60 + (exitOffroadDist / SPEED_OFFROAD_DRIVE) * 60;
  const exitPolyline = [...pavedPolyline, ...exitOffroadPath.slice(1)];

  let bestRouteOption = {
    time: exitTime,
    distance: pavedRoadDist + exitOffroadDist,
    pavedDist: pavedRoadDist,
    offroadDist: exitOffroadDist,
    polyline: exitPolyline,
    bypassed: exitOffroadAvoidance.bypassed,
    safeRouteUsed: null as string | null,
  };

  for (const sr of safeRoutes) {
    const srHighwaySegment = getHighwaySegment(start, sr.startPoint);
    const srEntrance = srHighwaySegment[0];
    const srExit = srHighwaySegment[srHighwaySegment.length - 1];

    let srPavedDist = calculateDistance(start, srEntrance);
    for (let i = 0; i < srHighwaySegment.length - 1; i++) {
      srPavedDist += calculateDistance(srHighwaySegment[i], srHighwaySegment[i + 1]);
    }
    srPavedDist += calculateDistance(srExit, sr.startPoint);

    let srPathDist = 0;
    for (let i = 0; i < sr.path.length - 1; i++) {
      srPathDist += calculateDistance(sr.path[i], sr.path[i + 1]);
    }

    const finalLegAvoidance = avoidBlockades(sr.endPoint, end, blockades);
    let finalLegDist = 0;
    for (let i = 0; i < finalLegAvoidance.path.length - 1; i++) {
      finalLegDist += calculateDistance(finalLegAvoidance.path[i], finalLegAvoidance.path[i + 1]);
    }

    const srTotalOffroad = srPathDist + finalLegDist;
    const srTime = (srPavedDist / SPEED_PAVED) * 60 + (srTotalOffroad / SPEED_OFFROAD_DRIVE) * 60;

    if (srTime < bestRouteOption.time) {
      const srPolyline: Coordinates[] = [start];
      if (calculateDistance(start, srEntrance) > 0.1) {
        srPolyline.push(srEntrance);
      }
      for (let i = 1; i < srHighwaySegment.length; i++) {
        srPolyline.push(srHighwaySegment[i]);
      }
      sr.path.forEach((pt) => {
        const last = srPolyline[srPolyline.length - 1];
        if (!last || calculateDistance(last, pt) > 0.05) {
          srPolyline.push(pt);
        }
      });
      finalLegAvoidance.path.slice(1).forEach((pt) => {
        srPolyline.push(pt);
      });

      bestRouteOption = {
        time: srTime,
        distance: srPavedDist + srTotalOffroad,
        pavedDist: srPavedDist,
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


