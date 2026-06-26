import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const serviceWorkerScript =
  process.env.NODE_ENV === "production"
    ? `
        if ('serviceWorker' in navigator) {
          var registerServiceWorker = function() {
            navigator.serviceWorker.register('/sw.js');
          };

          if (document.readyState === 'complete') {
            registerServiceWorker();
          } else {
            window.addEventListener('load', registerServiceWorker);
          }
        }
      `
    : `
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(function(registrations) {
            registrations.forEach(function(registration) {
              registration.unregister();
            });
          });
        }

        if ('caches' in window) {
          caches.keys().then(function(keys) {
            keys.forEach(function(key) {
              caches.delete(key);
            });
          });
        }
      `;

export const metadata: Metadata = {
  title: "Aounak - Al Qua'a Rapid Response",
  description:
    "Hyper-local offline-capable emergency response network for Al Qua'a.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0c0a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="apple-touch-startup-image" href="/splash.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        {children}
        {/* Service Worker registration — runs after hydration to prevent flicker */}
        <Script
          id="register-service-worker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: serviceWorkerScript,
          }}
        />
      </body>
    </html>
  );
}
