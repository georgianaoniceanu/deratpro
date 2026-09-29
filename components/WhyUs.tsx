import { Clock, ShieldCheck, UserCheck, BadgeCheck } from "lucide-react"
import type { CSSProperties } from "react"
import { advantages, certifications } from "../data/date"
import Stats from "./Stats"

// iconita pentru fiecare avantaj, in aceeasi ordine ca in date.ts
const icons = [Clock, ShieldCheck, UserCheck, BadgeCheck]

export default function WhyUs(){
    return(
        <section id="de-ce-noi" className="bg-sand-light py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <h2 data-reveal className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-forest dark:text-white text-balance text-center sm:text-left mb-12">
                    De ce să alegi DeratPro?
                </h2>

                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {advantages.map((a, i) => {
                        const Icon = icons[i]
                        return (
                            <li key={a.title} data-reveal style={{ "--reveal-delay": `${i * 100}ms` } as CSSProperties}>
                                <div className="w-12 h-12 rounded-xl bg-forest dark:bg-forest-surface text-mustard flex items-center justify-center mb-5">
                                    <Icon size={24} aria-hidden="true" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{a.title}</h3>
                                <p className="text-base text-typography-muted leading-relaxed">{a.description}</p>
                            </li>
                        )
                    })}
                </ul>

                <Stats></Stats>

                {/* autorizatiile firmei, ca insigne mici sub statistici */}
                <ul data-reveal className="mt-10 flex flex-wrap justify-center sm:justify-start gap-3" aria-label="Autorizații și certificări">
                    {certifications.map(c => (
                        <li
                            key={c}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sand-dark bg-white dark:bg-forest-surface text-base font-semibold text-forest dark:text-gray-100"
                        >
                            <BadgeCheck size={18} className="text-[#9A6410] dark:text-mustard" aria-hidden="true" />
                            {c}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
