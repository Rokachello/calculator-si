import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calculators.si — Practical calculators for your business",
  description: "Build, edit and share useful quote, estimate and ROI calculators for your customers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
