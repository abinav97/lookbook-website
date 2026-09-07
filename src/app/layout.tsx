import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { SITE } from "@/lib/site";
import { getFeaturedOutfits } from "@/lib/data";
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

const heroImage = getFeaturedOutfits()[0]?.images[0];

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    type: "website",
    url: "/",
    images: heroImage
      ? [{ url: heroImage.src, width: 1600, height: 2133, alt: heroImage.alt }]
      : [],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
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
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navigation />
        <main id="main" className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
