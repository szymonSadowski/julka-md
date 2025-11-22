import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "./auth";
import { PWAInstaller } from "@/components/pwa-installer";

export const metadata: Metadata = {
  title: "Julka MD",
  description: "Your personal medical assistant powered by AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Julka MD",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/square-logo-for-iphone.jpg",
    apple: "/square-logo-for-iphone.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/square-logo-for-iphone.jpg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="overscroll-none">
        <PWAInstaller />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
