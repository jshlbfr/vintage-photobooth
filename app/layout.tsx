import type { Metadata } from "next";
import { Allura, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

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
  description: "A little nostalgia. A memory to keep. Step inside the Vintage Photobooth.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${uiFont.variable} ${displayFont.variable} ${scriptFont.variable}`}
    >
      <body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body>
    </html>
  );
}
