"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, Phone, Mail, Shield, AlertCircle } from "lucide-react";
import { auth, isFirebaseConfigured, missingFirebaseEnv } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import Link from "next/link";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

type AuthMode = "default" | "email" | "phone" | "otp";
const AUTH_TIMEOUT_MS = 15000;

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const hasAuthCode = (error: unknown, codes: string[]) => {
  return error instanceof FirebaseError && codes.includes(error.code);
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
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("default");
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  
  // Phone Auth Object
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const canUseFirebaseAuth = isFirebaseConfigured && !loading;

  // ─── Google Auth ─────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await withAuthTimeout(
        signInWithPopup(auth, provider),
        "Firebase sign-in did not respond. Check Firebase config and authorized domains."
      );
      router.push("/responder");
    } catch (error: unknown) {
      console.error("Login failed", error);
      setError(getErrorMessage(error, "Failed to sign in with Google."));
      setLoading(false);
    }
  };

  // ─── Email & Password Auth ──────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) return;
    setLoading(true);
    setError(null);
    try {
      // First try to sign in
      await withAuthTimeout(
        signInWithEmailAndPassword(auth, email, password),
        "Firebase sign-in did not respond. Check Firebase config and authorized domains."
      );
      router.push("/responder");
    } catch (error: unknown) {
      // If user not found, auto-create account for hackathon purposes
      if (hasAuthCode(error, ["auth/user-not-found", "auth/invalid-credential"])) {
        try {
          await withAuthTimeout(
            createUserWithEmailAndPassword(auth, email, password),
            "Firebase account creation did not respond. Check Firebase config and authorized domains."
          );
          router.push("/responder");
        } catch (createError: unknown) {
          setError(getErrorMessage(createError, "Failed to create account."));
          setLoading(false);
        }
      } else {
        setError(getErrorMessage(error, "Authentication failed."));
        setLoading(false);
      }
    }
  };

  // ─── Phone Auth (Step 1: Send SMS) ───────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) return;
    setLoading(true);
    setError(null);

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }

      const verifier = window.recaptchaVerifier;
      if (!verifier) {
        throw new Error("Could not initialize phone verification.");
      }

      // Format number ensuring it has a + prefix
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const confirmation = await withAuthTimeout(
        signInWithPhoneNumber(auth, formattedNumber, verifier),
        "Firebase phone sign-in did not respond. Check phone auth and authorized domains."
      );
      setConfirmationResult(confirmation);
      setAuthMode("otp");
    } catch (error: unknown) {
      console.error(error);
      setError(getErrorMessage(error, "Failed to send SMS code."));
    }
    setLoading(false);
  };

  // ─── Phone Auth (Step 2: Verify OTP) ─────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setError(null);

    try {
      await withAuthTimeout(
        confirmationResult.confirm(otp),
        "Firebase OTP verification did not respond. Check phone auth and authorized domains."
      );
      router.push("/responder");
    } catch {
      setError("Invalid verification code.");
      setLoading(false);
    }
  };

  // ─── UI Renderers ────────────────────────────────────────────────────────
  const renderDefaultView = () => (
    <>
      <Button 
        onClick={handleGoogleLogin}
        disabled={!canUseFirebaseAuth}
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
        onClick={() => setAuthMode("phone")}
        disabled={!canUseFirebaseAuth}
        variant="outline"
        className="w-full h-12 bg-zinc-950/50 border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold tracking-wide"
      >
        <Phone size={18} className="mr-3 text-indigo-400" />
        Continue with Phone
      </Button>

      <Button 
        onClick={() => setAuthMode("email")}
        disabled={!canUseFirebaseAuth}
        variant="outline"
        className="w-full h-12 bg-zinc-950/50 border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold tracking-wide"
      >
        <Mail size={18} className="mr-3 text-indigo-400" />
        Continue with Email
      </Button>
    </>
  );

  const renderEmailView = () => (
    <form onSubmit={handleEmailAuth} className="space-y-4">
      <div className="space-y-2">
        <Input 
          type="email" 
          placeholder="responder@aounak.ae" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-zinc-950/50 border-zinc-700 text-white h-12"
        />
        <Input 
          type="password" 
          placeholder="Password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-zinc-950/50 border-zinc-700 text-white h-12"
        />
      </div>
      <Button type="submit" disabled={!canUseFirebaseAuth} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wider">
        {loading ? "Authenticating..." : "Sign In / Register"}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setAuthMode("default")} className="w-full text-zinc-400 hover:text-white">
        Back
      </Button>
    </form>
  );

  const renderPhoneView = () => (
    <form onSubmit={handleSendOtp} className="space-y-4">
      <div className="space-y-2">
        <Input 
          type="tel" 
          placeholder="+971501234567" 
          required 
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="bg-zinc-950/50 border-zinc-700 text-white h-12"
        />
        <p className="text-xs text-zinc-500 px-1">Include country code (e.g., +971)</p>
      </div>
      <div id="recaptcha-container"></div>
      <Button type="submit" disabled={!canUseFirebaseAuth} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wider">
        {loading ? "Sending SMS..." : "Send Verification Code"}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setAuthMode("default")} className="w-full text-zinc-400 hover:text-white">
        Back
      </Button>
    </form>
  );

  const renderOtpView = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div className="space-y-2">
        <Input 
          type="text" 
          placeholder="6-Digit Code" 
          required 
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="bg-zinc-950/50 border-zinc-700 text-white h-12 text-center text-lg tracking-[0.5em]"
        />
      </div>
      <Button type="submit" disabled={!canUseFirebaseAuth} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wider">
        {loading ? "Verifying..." : "Verify & Sign In"}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setAuthMode("phone")} className="w-full text-zinc-400 hover:text-white">
        Try another number
      </Button>
    </form>
  );

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
              {authMode === "otp" ? "Verify Phone" : "Sign In to Dispatch"}
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">
              {authMode === "email" ? "Enter your email and password" : 
               authMode === "phone" ? "We'll send you an SMS verification code" :
               authMode === "otp" ? "Enter the 6-digit code sent via SMS" :
               "Select your preferred authentication method"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
                <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-300/90">{error}</p>
              </div>
            )}

            {!isFirebaseConfigured && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-200/90">
                  Firebase is missing {missingFirebaseEnv.length} required environment value{missingFirebaseEnv.length === 1 ? "" : "s"}. Add them to <span className="font-mono">.env.local</span> and restart the dev server.
                </p>
              </div>
            )}

            {authMode === "default" && renderDefaultView()}
            {authMode === "email" && renderEmailView()}
            {authMode === "phone" && renderPhoneView()}
            {authMode === "otp" && renderOtpView()}

          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest mt-8 font-medium">
          Aounak Secure Responder Network &copy; 2026
        </p>
      </main>
    </div>
  );
}
