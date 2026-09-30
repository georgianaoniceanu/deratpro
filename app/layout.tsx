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

const title = "DeratPro | Deratizare, dezinsecție, dezinfecție";
const description =
  "Servicii complete de deratizare, dezinsecție și dezinfecție pentru locuințe și spații comerciale. Intervenții rapide, sigure și garantate.";

export const metadata: Metadata = {
  // adresa site-ului: din ea se face link-ul complet spre imaginea de previzualizare (app/opengraph-image.jpg)
  metadataBase: new URL("https://deratpro-five.vercel.app"),
  title,
  description,
  // previzualizarea cand link-ul e trimis pe WhatsApp, LinkedIn, Facebook etc.;
  // imaginea o adauga Next.js singur, din fisierul app/opengraph-image.jpg
  openGraph: {
    title,
    description,
    siteName: "DeratPro",
    locale: "ro_RO",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${jakarta.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        {/* ruleaza inainte sa apara pagina:
            1. aplica tema salvata (sau cea a sistemului), ca sa nu "clipeasca" din alb in negru
            2. la refresh, pagina porneste mereu de sus: browserul nu mai tine minte pozitia,
               iar ancora din adresa (ex. #contact, pusa de linkurile din meniu) e scoasa */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}if("scrollRestoration" in history)history.scrollRestoration="manual";if(location.hash)history.replaceState(null,"",location.pathname+location.search);addEventListener("load",function(){scrollTo(0,0)});`,
          }}
        />
      </head>
      {/* extensiile de browser adauga uneori atribute pe html/body inainte de React */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
