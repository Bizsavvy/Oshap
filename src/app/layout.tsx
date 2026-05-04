import type { Metadata } from "next";
import { Space_Grotesk, Poppins, Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Oshap — Scan. Order. Pay.",
  description:
    "QR-based table ordering and payment system. Scan a QR code, browse the menu, place orders instantly, and pay via bank transfer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${spaceGrotesk.variable} ${poppins.variable} ${inter.variable}`}
    >
      <head>
        <link href="https://cdn.jsdelivr.net/npm/mingcute_icon/font/Mingcute.css" rel="stylesheet" />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
