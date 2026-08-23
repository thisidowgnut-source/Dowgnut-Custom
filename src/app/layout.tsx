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
  title: "DowgNut — Donut Delivery",
  description:
    "Order fresh donuts delivered to your door. Touch 'n Go, DuitNow, card payment. Bold, playful, authentic.",
  applicationName: "DowgNut",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DowgNut",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#07579B",
  width: "device-width",
  initialScale: 1,
  
  
  viewportFit: "cover",
};

const SW_REGISTER = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
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
