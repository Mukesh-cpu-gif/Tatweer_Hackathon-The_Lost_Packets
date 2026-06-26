import Link from "next/link";

export default function MockMap() {
  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      <header className="p-4 bg-slate-800 flex items-center shadow-lg z-10">
        <Link href="/responder" className="text-blue-400 font-bold mr-4">← Back</Link>
        <h1 className="text-white font-bold text-lg">Routing to Incident...</h1>
      </header>
      
      <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-700 relative flex items-center justify-center">
        {/* Mock Map UI */}
        <div className="absolute inset-0 opacity-50 bg-gradient-to-tr from-slate-900 via-transparent to-slate-800 pointer-events-none"></div>
        
        <div className="text-center z-10">
          <div className="bg-slate-800 text-white p-6 rounded-xl border border-slate-600 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-green-400">Optimal Dune Route Found</h2>
            <p className="text-slate-300 mb-4">Bypassing paved roads. ETA: 12 minutes.</p>
            <div className="w-full h-32 bg-slate-900 rounded border border-slate-700 flex items-center justify-center">
              <span className="text-slate-500">[Mock Mapbox UI Rendered Here]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
