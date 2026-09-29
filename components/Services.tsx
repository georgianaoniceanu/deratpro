import { Rat, Bug, SprayCan } from "lucide-react"
import {services} from "../data/date"

// iconita pentru fiecare serviciu, in aceeasi ordine ca in date.ts
const icons = [Rat, Bug, SprayCan]

export default function Services(){
    return(
        <section id="servicii" className="bg-sand py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-forest dark:text-white text-balance text-center sm:text-left">
                    Serviciile noastre
                </h2>
                <p className="mt-3 text-lg text-typography-muted leading-relaxed max-w-2xl text-center sm:text-left mx-auto sm:mx-0">
                    Soluții profesionale pentru locuințe și afaceri.
                </p>

                <ul className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {services.map((s, i) => {
                        const Icon = icons[i]
                        return (
                            <li key={s.title} className="h-full bg-white dark:bg-forest-surface rounded-2xl p-8 lg:p-9 border border-sand-dark shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-16 h-16 rounded-2xl bg-sand dark:bg-white/5 flex items-center justify-center text-forest dark:text-mustard mb-8">
                                    <Icon size={32} aria-hidden="true" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{s.title}</h3>
                                <p className="text-base text-typography-muted leading-relaxed">{s.description}</p>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}
