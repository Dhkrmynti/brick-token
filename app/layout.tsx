import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Dela_Gothic_One({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "$BRICK | Every trade feeds the furnace",
  description:
    "$BRICK is a toy-brick meme coin on Robinhood Chain, launched on Pons. Creator fees buy $BRICK back and burn it.",
};

export const viewport: Viewport = {
  themeColor: "#1f44cf",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
