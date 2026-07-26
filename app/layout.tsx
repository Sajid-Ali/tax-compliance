import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Compliance Reminders — SECP Form A tracking",
  description: "Never miss an SECP annual filing deadline again.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: Grammarly (and similar extensions) injects
          data-new-gr-c-s-check-loaded / data-gr-ext-installed onto <body>
          before React hydrates. That's an extension mutating the DOM, not a
          real server/client mismatch — this tells React to accept the DOM's
          attributes on this element rather than warn. It does NOT suppress
          hydration warnings for anything inside <body>. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
