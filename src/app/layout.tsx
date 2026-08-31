import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lilita_One } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lilitaOne = Lilita_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "DOHNUT — Donut Delivery",
  description:
    "GOOD VIBE. GOOD DOH. Order fresh donuts delivered to your door. Touch 'n Go, DuitNow, card payment. Bold, playful, authentic.",
  applicationName: "DOHNUT",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon-new.png", type: "image/png", sizes: "256x256" }],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DOHNUT",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FDE047",
  width: "device-width",
  initialScale: 1,
  
  
  viewportFit: "cover",
};

const SW_REGISTER = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Force-check for SW updates on every load (bypasses HTTP cache hints).
      reg.update().catch(() => {});
    }).catch(() => {});
    // When a new service worker takes control, reload once so the fresh
    // shell replaces the stale page (guarded to avoid reload loops).
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lilitaOne.variable} antialiased bg-background text-foreground min-h-screen flex flex-col overscroll-none`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
