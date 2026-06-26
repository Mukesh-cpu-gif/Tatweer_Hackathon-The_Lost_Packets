"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

/**
 * Leaflet interacts with the DOM, which causes Next.js server-side rendering
 * to throw "window is not defined" errors. 
 * This wrapper dynamically imports the map component only on the client side.
 */
const DynamicMap = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
});

interface MapWrapperProps {
  routeType: "paved" | "dune";
  start: [number, number];
  end: [number, number];
}

export default function MapWrapper(props: MapWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full bg-slate-900/60 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DynamicMap {...props} />
    </Suspense>
  );
}
