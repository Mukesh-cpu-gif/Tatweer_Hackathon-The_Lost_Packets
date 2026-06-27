import { Suspense } from "react";
import ProfileClient from "./ProfileClient";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm font-bold uppercase tracking-widest text-zinc-500">
          Loading Profile...
        </div>
      }
    >
      <ProfileClient />
    </Suspense>
  );
}
