"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Actual Firebase integration for Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/responder");
    } catch (error) {
      console.error("Login failed", error);
      // Fallback or error handling can be added here
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 flex flex-col justify-center px-5 selection:bg-indigo-500/30 overflow-hidden">
      
      {/* ─── Cosmic Background Elements ──────────────────────────── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-sky-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── Top Nav ──────────────────────────────────────────── */}
      <nav className="absolute top-0 left-0 w-full z-10 px-5 py-6">
        <Link href="/">
          <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 -ml-2 rounded-full h-10 w-10 p-0">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </Button>
        </Link>
      </nav>

      <main className="relative z-10 w-full max-w-md mx-auto space-y-8">
        
        {/* ─── Header ─────────────────────────────────── */}
        <div className="text-center space-y-3 relative">
          <div className="absolute inset-0 bg-indigo-500/10 blur-[50px] rounded-full w-32 h-32 mx-auto -z-10" />
          <div className="inline-flex p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 mb-2 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <Shield size={48} strokeWidth={1.5} className="text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Aounak Login
          </h1>
          <p className="text-indigo-200/60 font-medium text-lg tracking-wide">
            Responder Access
          </p>
        </div>

        {/* ─── Login Card ──────────────────────────── */}
        <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 shadow-none">
          <CardHeader className="pb-4 border-b border-zinc-800/50 text-center">
            <CardTitle className="text-sm font-bold tracking-widest uppercase text-zinc-300">
              Sign In to Dispatch
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">
              Select your preferred authentication method
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            
            <Button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-white text-zinc-950 hover:bg-zinc-200 font-semibold tracking-wide"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? "Connecting..." : "Continue with Google"}
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-600 text-xs font-medium uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <Button 
              onClick={handleMockLogin}
              disabled={loading}
              variant="outline"
              className="w-full h-12 bg-zinc-950/50 border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold tracking-wide"
            >
              <Phone size={18} className="mr-3 text-indigo-400" />
              {loading ? "Connecting..." : "Continue with Phone"}
            </Button>

            <Button 
              onClick={handleMockLogin}
              disabled={loading}
              variant="outline"
              className="w-full h-12 bg-zinc-950/50 border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold tracking-wide"
            >
              <Mail size={18} className="mr-3 text-indigo-400" />
              {loading ? "Continue with Email" : "Continue with Email"}
            </Button>

          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest mt-8 font-medium">
          Aounak Secure Responder Network &copy; 2026
        </p>
      </main>
    </div>
  );
}
