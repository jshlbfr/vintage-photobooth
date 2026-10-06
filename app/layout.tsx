import type { Metadata } from "next";
import { Allura, Playfair_Display, Poppins } from "next/font/google";
import { AmbientBackground } from "@/components/artwork/ambient-background";
import { SessionProvider } from "@/components/session/session-provider";
import { MediaProvider } from "@/components/media/media-provider";
import "./globals.css";

import Script from "next/script";

const uiFont = Poppins({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const scriptFont = Allura({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Vintage Photobooth", template: "%s · Vintage Photobooth" },
  description:
    "A little nostalgia. A memory to keep. Step inside the Vintage Photobooth.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${uiFont.variable} ${displayFont.variable} ${scriptFont.variable}`}
    >
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1193568598392219"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <AmbientBackground />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SessionProvider>
          <MediaProvider>{children}</MediaProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
