import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#05070b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Jingle — World Audio Observatory & Geography Game",
  description: "Explore the planet through sound. Spin the 3D satellite globe, tune into world music frequencies, and test your geography ear in Jingle.",
  keywords: ["Jingle", "Radio Garden", "globle", "heardle", "geoguessr", "music trivia", "satellite globe", "3D globe", "world music"],
  authors: [{ name: "Jingle" }],
  openGraph: {
    title: "Jingle — World Audio Observatory & Geography Game",
    description: "Explore the planet through sound. Spin the 3D globe, tune into world music, and test your geography ear.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#08090d] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
