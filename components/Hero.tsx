import { contactInfo } from "@/data/date"

export default function Hero() {
    return (
        <section id="hero" className="bg-forest text-white min-h-[calc(100svh-89px)] sm:min-h-[calc(100svh-97px)] flex items-center">
            <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] mb-6 text-balance">
                    Cu DeratPro, spațiile tale rămân <span className="font-serif italic text-mustard">curate</span>
                </h1>
                <p className="text-lg lg:text-xl text-gray-300 leading-relaxed max-w-2xl mb-9">
                    Servicii complete de deratizare, dezinsecție și dezinfecție pentru locuințe și spații comerciale. Intervenții rapide, sigure și garantate.
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
        </section>
    )
}