import Image from "next/image"
import { contactInfo } from "@/data/date"
import HeroClean from "./HeroClean"
import HeroHint from "./HeroHint"

export default function Hero() {
    // hero-ul umple primul ecran, sub navbar. +1px: cand ecranul e scalat (zoom in browser, DevTools, densitati
    // de pixeli fractionare), marginea se poate rotunji in jos si ramane vizibil un rand din sectiunea urmatoare
    return (
        <section id="hero" className="relative overflow-hidden bg-forest text-white min-h-[calc(100svh-var(--nav-h)+1px)] flex items-center py-16 sm:py-20">
            {/* fotografia de fundal; decorativa, deci alt gol */}
            <Image
                src="/hero-bg.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                // pe telefon si tableta (ecran tactil sau sub 1024px) poza nu se vede de la inceput:
                // hero-ul e verde si ceata din animatie o descopera
                className="object-cover object-[right_35%] [@media(pointer:coarse)]:motion-safe:opacity-0 max-lg:motion-safe:opacity-0"
            />
            {/* strat verde peste poza, ca textul alb sa se citeasca (pe telefon mai inchis sus, pe desktop in stanga).
                se vede doar pana porneste animatia; apoi shader-ul deseneaza singur acelasi strat, peste el */}
            <div className="absolute inset-0 bg-linear-to-b from-forest/85 via-forest/70 to-forest/45 lg:bg-linear-to-r lg:from-forest lg:via-forest/85 lg:to-forest/30" aria-hidden="true" />
            {/* animatia three.js: poza apare murdara si se "curata" pe unde trece mouse-ul */}
            <HeroClean />

            <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12">
                {/* titlul si textul au o umbra discreta, ca sa ramana lizibile si peste zonele luminoase ale pozei curatate */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] mb-6 text-balance [text-shadow:0_2px_14px_rgb(0_0_0/0.55)]">
                    Cu DeratPro, spațiile tale rămân <span className="font-serif italic text-mustard">curate</span>
                </h1>
                <p className="text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mb-9 [text-shadow:0_1px_10px_rgb(0_0_0/0.6)]">
                    Servicii complete de deratizare, dezinsecție și dezinfecție pentru locuințe și spații comerciale din {contactInfo.area}. Intervenții rapide, sigure și garantate.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
                    <a
                        href="#contact"
                        className="text-center px-8 py-4 bg-mustard hover:bg-mustard-hover text-forest font-bold rounded-xl transition hover:-translate-y-0.5"
                    >
                        Solicită ofertă gratuită
                    </a>
                    <a
                        href={contactInfo.phoneHref}
                        className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl border border-white/20 hover:border-mustard/60 hover:bg-white/5 font-semibold transition"
                    >
                        <span className="w-3 h-3 rounded-full bg-emerald-400 motion-safe:animate-pulse" aria-hidden="true" />
                        Urgențe: {contactInfo.phoneDisplay}
                    </a>
                </div>
            </div>
            {/* indiciul sta jos, in stanga hero-ului, aliniat cu textul */}
            <HeroHint />
        </section>
    )
}