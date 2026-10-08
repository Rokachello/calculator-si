import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calculators.si - spletni kalkulatorji",
  description: "Opisite, kaj zelite izracunati, in ustvarite uporaben interaktivni kalkulator.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sl"><body>{children}</body></html>;
}
