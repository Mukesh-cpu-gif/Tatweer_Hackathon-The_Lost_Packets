import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const productionServiceWorkerScript = `
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
`;

const developmentServiceWorkerCleanupScript = `
  (function() {
    var hadController = false;
    var cleanupTasks = [];

    if ('serviceWorker' in navigator) {
      hadController = Boolean(navigator.serviceWorker.controller);
      cleanupTasks.push(
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          return Promise.all(registrations.map(function(registration) {
            return registration.unregister();
          }));
        })
      );
    }

    if ('caches' in window) {
      cleanupTasks.push(
        caches.keys().then(function(keys) {
          return Promise.all(keys.map(function(key) {
            return caches.delete(key);
          }));
        })
      );
    }

    if (cleanupTasks.length > 0) {
      Promise.all(cleanupTasks).then(function() {
        if (hadController && !sessionStorage.getItem('aounak-sw-dev-cleaned')) {
          sessionStorage.setItem('aounak-sw-dev-cleaned', '1');
          window.location.reload();
        }
      });
    }
  })();
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
        {process.env.NODE_ENV !== "production" && (
          <Script
            id="cleanup-development-service-worker"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: developmentServiceWorkerCleanupScript,
            }}
          />
        )}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="apple-touch-startup-image" href="/splash.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
        {process.env.NODE_ENV === "production" && (
          <Script
            id="register-service-worker"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: productionServiceWorkerScript,
            }}
          />
        )}
      </body>
    </html>
  );
}
