import type { Metadata } from "next";
import { Geist_Mono, Baloo_2, Poppins } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

// Google Analytics 4 measurement ID. Public (it ships in the page HTML), so a
// literal default is fine; override per-environment with the env var.
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-64MMZ0T9Y2";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Tala brand board typography: Baloo 2 is the rounded display face (logo,
// headings); Poppins is the body face with a light-italic accent. The legacy
// --font-fredoka / --font-dm-serif utilities are aliased onto these in
// globals.css so existing markup picks up the brand fonts automatically.
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
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
      className={`${poppins.variable} ${baloo.variable} ${geistMono.variable} h-full antialiased`}
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
