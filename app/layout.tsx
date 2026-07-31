import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Sets data-theme before first paint from the visitor's stored preference, so
// there's no flash of the wrong theme while React hydrates.
const THEME_INIT_SCRIPT = `
try {
  var stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    document.documentElement.dataset.theme = stored;
  }
} catch (e) {}
`;

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
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* suppressHydrationWarning: Grammarly (and similar extensions) injects
          data-new-gr-c-s-check-loaded / data-gr-ext-installed onto <body>
          before React hydrates. That's an extension mutating the DOM, not a
          real server/client mismatch — this tells React to accept the DOM's
          attributes on this element rather than warn. It does NOT suppress
          hydration warnings for anything inside <body>. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
