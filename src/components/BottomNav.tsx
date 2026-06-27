"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/75 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-12 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                active
                  ? "border-indigo-500/35 bg-indigo-600/20 text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.18)]"
                  : "border-transparent text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-300"
              }`}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
