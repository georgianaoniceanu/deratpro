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
    <html lang="ro" className={`${jakarta.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        {/* aplica tema salvata (sau cea a sistemului) inainte sa apara pagina, ca sa nu "clipeasca" din alb in negru */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      {/* extensiile de browser adauga uneori atribute pe html/body inainte de React */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
