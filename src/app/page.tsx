import Link from "next/link";
import RiskRadar from "@/components/RiskRadar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">Aounak (عَوْنَك)</h1>
        <p className="text-gray-600">Al Qua'a Rapid Response Network</p>
      </header>

      <RiskRadar />

      <main className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-4">Urgent SOS</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/sos?type=snake" className="bg-red-100 hover:bg-red-200 p-6 rounded-xl shadow-sm text-center border-2 border-red-500 transition-colors">
              <div className="text-5xl mb-2">🐍</div>
              <div className="font-bold text-red-800">Snake Bite</div>
            </Link>
            <Link href="/sos?type=medical" className="bg-red-100 hover:bg-red-200 p-6 rounded-xl shadow-sm text-center border-2 border-red-500 transition-colors">
              <div className="text-5xl mb-2">❤️‍🩹</div>
              <div className="font-bold text-red-800">Medical Assist</div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Asset/Livelihood SOS</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/sos?type=tractor" className="bg-amber-100 hover:bg-amber-200 p-6 rounded-xl shadow-sm text-center border-2 border-amber-600 transition-colors">
              <div className="text-5xl mb-2">🚜</div>
              <div className="font-bold text-amber-900">Vehicle Stuck</div>
            </Link>
            <Link href="/sos?type=livestock" className="bg-amber-100 hover:bg-amber-200 p-6 rounded-xl shadow-sm text-center border-2 border-amber-600 transition-colors">
              <div className="text-5xl mb-2">🐪</div>
              <div className="font-bold text-amber-900">Sick Livestock</div>
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-12 text-center">
        <Link href="/responder" className="text-blue-600 underline font-semibold">
          Switch to Responder Dashboard
        </Link>
      </footer>
    </div>
  );
}
