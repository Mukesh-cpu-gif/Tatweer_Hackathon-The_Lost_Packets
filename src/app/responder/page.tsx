import Link from "next/link";
import { mockIncidents } from "@/lib/mockData";

export default function ResponderDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Faza'a Dispatch</h1>
          <p className="text-slate-400">Welcome, Ahmed (Tags: Medical, 4x4)</p>
        </div>
        <Link href="/" className="text-blue-400 underline text-sm">Exit</Link>
      </header>

      <main>
        <h2 className="text-xl font-bold mb-4 text-slate-200">Nearby Incidents (Skill Matched)</h2>
        <div className="space-y-4">
          {mockIncidents.map(inc => (
            <div key={inc.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg text-red-400">{inc.type}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${inc.status === 'Pending' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'}`}>
                  {inc.status}
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-4">Coordinates: {inc.lat}, {inc.lng}</p>
              
              <div className="flex gap-2">
                <Link href="/responder/map" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold flex-1 text-center">
                  View Dune Route
                </Link>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold flex-1">
                  Accept (On My Way)
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
