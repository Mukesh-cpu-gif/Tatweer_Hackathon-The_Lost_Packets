"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { AlertCircle, ChevronLeft, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { auth, isFirebaseConfigured, missingFirebaseEnv } from "@/lib/firebase";

const AUTH_TIMEOUT_MS = 15000;

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

export default function RegisterPage() {
  const router = useRouter();
  const { t, isAr } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFirebaseConfigured) return;

    if (!name.trim() || !email.trim() || password.length < 6) {
      setError(t("Add your name, email, and a password of at least 6 characters."));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const credential = await withAuthTimeout(
        createUserWithEmailAndPassword(auth, email.trim(), password),
        t("Firebase account creation did not respond. Check Firebase config and authorized domains.")
      );

      try {
        await updateProfile(credential.user, { displayName: name.trim() });
      } catch (profileError) {
        console.error("Display name update failed", profileError);
      }

      router.push("/profile?setup=1");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("Failed to create account."));
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-zinc-950 px-5 selection:bg-sky-500/30">
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-sky-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />

      <nav className="absolute left-0 top-0 z-10 w-full px-5 py-6">
        <Link href="/">
          <Button variant="ghost" className="-ml-2 h-10 w-10 rounded-full p-0 text-zinc-400 hover:bg-white/5 hover:text-white">
            <ChevronLeft size={24} strokeWidth={1.5} className={isAr ? "rotate-180" : ""} />
          </Button>
        </Link>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-md space-y-8">
        <div className="relative space-y-3 text-center">
          <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-sky-500/10 blur-[50px]" />
          <div className="mb-2 inline-flex rounded-3xl border border-sky-500/30 bg-sky-500/10 p-5 shadow-[0_0_30px_rgba(14,165,233,0.15)]">
            <ShieldCheck size={48} strokeWidth={1.5} className="text-sky-400" />
          </div>
          <h1 className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-3xl font-bold uppercase tracking-widest text-transparent">
            {t("Register")}
          </h1>
          <p className="text-lg font-medium tracking-wide text-sky-200/60">{t("Join the community response network")}</p>
        </div>

        <Card className="border border-zinc-800/50 bg-zinc-900/40 shadow-none backdrop-blur-md">
          <CardHeader className="border-b border-zinc-800/50 pb-4 text-center">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-300">
              {t("Create Account")}
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-zinc-500">
              {t("You will complete your contact, vehicle, skills, and medical details next.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                <p className="text-xs text-rose-300/90">{error}</p>
              </div>
            )}

            {!isFirebaseConfigured && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-xs text-amber-200/90">
                  {t("Firebase is missing")} {missingFirebaseEnv.length} {t("required environment values.")}
                </p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                type="text"
                placeholder={t("Full Name")}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 border-zinc-700 bg-zinc-950/50 text-white"
              />
              <Input
                type="email"
                placeholder={t("Email Address")}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 border-zinc-700 bg-zinc-950/50 text-white"
              />
              <Input
                type="password"
                placeholder={t("Password (Min 6 characters)")}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 border-zinc-700 bg-zinc-950/50 text-white"
              />

              <Button type="submit" disabled={!isFirebaseConfigured || loading} className="h-12 w-full bg-sky-600 font-bold tracking-wider text-white hover:bg-sky-500">
                <UserPlus size={18} className="mr-2" />
                {loading ? t("Creating Account...") : t("Create Account")}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-zinc-500">
              {t("Already registered?")}{" "}
              <Link href="/login" className="font-semibold text-sky-300 hover:text-sky-200">
                {t("Log in")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
