import { Suspense } from "react";
import SOSClient from "./SOSClient";

export default function SOSPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
          <div className="w-8 h-8 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin mb-4" />
          <p className="tracking-widest uppercase font-bold text-sm">
            Initializing Emergency Systems...
          </p>
        </div>
      }
    >
      <SOSClient />
    </Suspense>
  );
}
