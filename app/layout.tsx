import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import InstallPrompt from "@/components/ui/install-prompt";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// All meta tags go through Next.js exports — never a raw <head> in App Router
export const metadata: Metadata = {
  title: "HireCompass - Premium Job Application Tracker",
  description:
    "Organize, monitor, and optimize your job applications, interviews, and offers in one professional dashboard.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HireCompass",
  },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: "/logo.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-[100dvh] flex flex-col bg-background text-foreground">
        <Providers>
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
