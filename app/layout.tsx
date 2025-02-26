import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Priority Matrix",
  description: "An Eisenhower Matrix task management app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Priority Matrix",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Priority Matrix" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased bg-background text-foreground`}
      >
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
