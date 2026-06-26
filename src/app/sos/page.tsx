"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OfflineAnimalAI from "@/components/OfflineAnimalAI";
import { generateSmsDeepLink } from "@/lib/sms";

export default function SosPage() {
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const handleOfflineSms = () => {
    if (!coords) return alert("Waiting for GPS...");
    const link = generateSmsDeepLink("123456789", "Snake Bite", coords);
    window.location.href = link;
  };

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <Link href="/" className="text-blue-600 underline mb-6 inline-block">← Back</Link>
      
      <h1 className="text-3xl font-bold text-red-700 mb-2">Active Emergency</h1>
      <p className="text-gray-700 mb-6">Stay calm. Help is being arranged.</p>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-bold">GPS Location Status</h2>
        <p className="font-mono text-sm mt-1 text-gray-600">
          {coords ? `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}` : "Acquiring satellites..."}
        </p>
      </div>

      <OfflineAnimalAI />

      <div className="mt-8">
        <button 
          onClick={handleOfflineSms}
          className="w-full bg-red-600 text-white font-bold text-xl py-4 rounded-xl shadow-lg hover:bg-red-700"
        >
          Send Offline SMS (Zero Data)
        </button>
      </div>
      
      <div className="mt-8 bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
        <h3 className="font-bold text-blue-800">First-Aid Guidance (Offline)</h3>
        <p className="text-sm mt-2">If bitten by a snake, keep the bitten area still and below the level of the heart. Do not apply a tourniquet.</p>
      </div>
    </div>
  );
}
