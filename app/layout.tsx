import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  weight: "600",
  style: "italic",
});

export const metadata: Metadata = {
  title: "DeratPro | Deratizare, dezinsecție, dezinfecție",
  description:
    "Servicii complete de deratizare, dezinsecție și dezinfecție pentru locuințe și spații comerciale. Intervenții rapide, sigure și garantate.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${jakarta.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
