import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Abi's Lookbook",
    template: "%s — Abi's Lookbook",
  },
  description:
    "A living fashion portfolio. Curated outfits, personal style, and the closet behind it all.",
  openGraph: {
    title: "Abi's Lookbook",
    description: "A living fashion portfolio.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${inter.variable} bg-bg text-text antialiased`}
      >
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
