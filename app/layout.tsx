import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Instrument_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WiseGraph",
  description:
    "Standardized assessment scores, made visible. Radial and bell-curve views for teachers, psychologists, and parent conferences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${fraunces.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SmoothScroll />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
