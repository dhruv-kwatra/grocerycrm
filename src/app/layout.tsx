import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import PortalToaster from "@/components/PortalToaster";

// Outfit is the newui prototype's typeface — geometric, tight, a little more
// display-y than Roboto at heading weights. The CSS variable name is unchanged
// (--font-dm-sans), so globals.css and every `font-display` consumer follow
// along with no edits.
const dmSans = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RetailIQ",
  description: "RetailIQ — inventory forecasting and store operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full antialiased ${dmSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full" suppressHydrationWarning>
        <style>{`
          html { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--muted) 40%, transparent) transparent; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb {
            background-color: color-mix(in srgb, var(--muted) 32%, transparent);
            border-radius: 999px;
            border: 2.5px solid transparent; background-clip: padding-box; min-height: 44px;
            transition: background-color .2s ease;
          }
          ::-webkit-scrollbar-thumb:hover { background-color: color-mix(in srgb, var(--muted) 60%, transparent); }
          ::-webkit-scrollbar-thumb:active { background-color: color-mix(in srgb, var(--muted) 75%, transparent); }
          ::-webkit-scrollbar-corner { background: transparent; }
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { width: 0; height: 0; display: none; }
        `}</style>
        {children}
        <PortalToaster />
      </body>
    </html>
  );
}
