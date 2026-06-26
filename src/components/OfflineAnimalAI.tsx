"use client";

import { useState } from "react";

export default function OfflineAnimalAI() {
  const [result, setResult] = useState<string | null>(null);

  const handleSimulateScan = () => {
    // In full implementation, this will load TensorFlow.js MobileNet offline
    setResult("Scanning (Offline)... Viper Detected (High Confidence)");
  };

  return (
    <div className="border border-gray-300 p-4 rounded-lg bg-gray-50">
      <h3 className="font-bold text-lg mb-2">Offline Animal ID</h3>
      <p className="text-sm text-gray-600 mb-4">Take a photo of the snake/scorpion. We use on-device AI to identify it without internet.</p>
      <button 
        onClick={handleSimulateScan}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
      >
        📷 Capture & Identify
      </button>
      {result && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 font-bold rounded">
          {result}
        </div>
      )}
    </div>
  );
}
