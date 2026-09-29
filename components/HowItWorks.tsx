import { steps } from "../data/date"
export default function HowItWorks(){
    return(
        <section id="cum-functioneaza" className="bg-sand-light py-20 lg:py-28 border-b border-sand-dark">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-forest dark:text-white text-balance text-center sm:text-left mb-12 lg:mb-16">
                    Cum decurge intervenția
                </h2>

                <div className="relative">
                    {/* linia care leaga cercurile: verticala pe mobil, orizontala pe desktop */}
                    <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-sand-dark lg:hidden" aria-hidden="true" />
                    <div className="hidden lg:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5 bg-sand-dark" aria-hidden="true" />

                <ul className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
                    {steps.map((s, i) => (
                        <li key={s.title} className="relative flex items-start gap-6 lg:flex-col lg:items-center lg:text-center">
                            <div className="relative z-10 shrink-0 w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-forest dark:bg-forest-surface dark:ring-1 dark:ring-white/10 text-mustard font-bold text-lg lg:text-xl flex items-center justify-center shadow-md">
                                {String(i + 1).padStart(2, "0")}
                            </div>
                            <div className="pt-3 lg:pt-2">
                                <h3 className="text-xl font-bold mb-2 lg:mb-3">{s.title}</h3>
                                <p className="text-base text-typography-muted leading-relaxed max-w-xs">{s.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                </div>
            </div>
        </section>
    )
}
