import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, DM_Serif_Display, Spectral } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

// Google Analytics 4 measurement ID. Public (it ships in the page HTML), so a
// literal default is fine; override per-environment with the env var.
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-64MMZ0T9Y2";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

// Spectral (serif) is the app-wide body face. Loaded via the real next/font
// mechanism and wired up as `--font-sans` in globals.css, so every page's body
// copy inherits it. Fredoka (headings/labels/buttons) and DM Serif (decorative
// taglines) are unaffected — they carry their own explicit font utilities.
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tala",
  description: "Small business marketing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${dmSerif.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
