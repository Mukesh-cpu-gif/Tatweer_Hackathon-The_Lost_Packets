"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { AlertCircle, ChevronLeft, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, isFirebaseConfigured, missingFirebaseEnv } from "@/lib/firebase";

const AUTH_TIMEOUT_MS = 15000;

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const withAuthTimeout = async <T,>(operation: Promise<T>, message: string) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) router.replace("/home");
    });
    return () => unsubscribe();
  }, [router]);

  const canUseFirebaseAuth = isFirebaseConfigured && !loading;

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) return;
    setLoading(true);
    setError(null);
    try {
      await withAuthTimeout(
        signInWithPopup(auth, new GoogleAuthProvider()),
        "Firebase sign-in did not respond. Check Firebase config and authorized domains."
      );
      router.push("/home");
    } catch (nextError: unknown) {
      setError(getErrorMessage(nextError, "Failed to sign in with Google."));
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFirebaseConfigured) return;
    setLoading(true);
    setError(null);
    try {
      await withAuthTimeout(
        signInWithEmailAndPassword(auth, email, password),
        "Firebase sign-in did not respond. Check Firebase config and authorized domains."
      );
      router.push("/home");
    } catch (nextError: unknown) {
      setError(getErrorMessage(nextError, "Authentication failed. Please check your credentials."));
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 px-5 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-sky-600/10 blur-[100px]" />

      <nav className="absolute left-0 top-0 z-10 w-full px-5 py-6">
        <Link href="/">
          <Button variant="ghost" className="-ml-2 h-10 w-10 rounded-full p-0 text-zinc-400 hover:bg-white/5 hover:text-white">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </Button>
        </Link>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-md space-y-8">
        <div className="relative space-y-3 text-center">
          <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-indigo-500/10 blur-[50px]" />
          <div className="mb-2 inline-flex rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-5 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <Shield size={48} strokeWidth={1.5} className="text-indigo-400" />
          </div>
          <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-3xl font-bold uppercase tracking-widest text-transparent">
            Aounak Login
          </h1>
          <p className="text-lg font-medium tracking-wide text-indigo-200/60">Community Access</p>
        </div>

        <Card className="border border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
          <CardHeader className="border-b border-zinc-800/50 pb-4 text-center">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-300">
              Sign In
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-zinc-500">
              Return to your profile, history, and helper network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                <p className="text-xs text-rose-300/90">{error}</p>
              </div>
            )}

            {!isFirebaseConfigured && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-xs text-amber-200/90">
                  Firebase is missing {missingFirebaseEnv.length} required environment value{missingFirebaseEnv.length === 1 ? "" : "s"}.
                </p>
              </div>
            )}

            <Button
              onClick={handleGoogleLogin}
              disabled={!canUseFirebaseAuth}
              className="h-12 w-full bg-white font-semibold tracking-wide text-zinc-950 hover:bg-zinc-200"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? "Connecting..." : "Continue with Google"}
            </Button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-zinc-800" />
              <span className="mx-4 flex-shrink-0 text-xs font-medium uppercase tracking-widest text-zinc-600">Or</span>
              <div className="flex-grow border-t border-zinc-800" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 border-zinc-700 bg-zinc-950/50 text-white"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 border-zinc-700 bg-zinc-950/50 text-white"
                />
              </div>
              <Button type="submit" disabled={!canUseFirebaseAuth} className="h-12 w-full bg-indigo-600 font-bold tracking-wider text-white hover:bg-indigo-500">
                <Mail size={18} className="mr-2" />
                {loading ? "Authenticating..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-xs text-zinc-500">
              New to Aounak?{" "}
              <Link href="/register" className="font-semibold text-indigo-300 hover:text-indigo-200">
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
