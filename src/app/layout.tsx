import type { Metadata, Viewport } from "next";
import { EB_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-poem",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-ui",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ein Gedicht findet dich",
  description: "Nicht du suchst das Gedicht – das Gedicht findet dich.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gedicht",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d0d0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${ebGaramond.variable} ${sourceSans.variable} h-full`}
    >
      <body className="h-full overflow-hidden antialiased font-[family-name:var(--font-ui)]">
        {children}
      </body>
    </html>
  );
}
