import { Clock, ShieldCheck, UserCheck, BadgeCheck } from "lucide-react"
import { advantages } from "../data/date"
import Stats from "./Stats"

// iconita pentru fiecare avantaj, in aceeasi ordine ca in date.ts
const icons = [Clock, ShieldCheck, UserCheck, BadgeCheck]

export default function WhyUs(){
    return(
        <section id="de-ce-noi" className="bg-sand py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-forest text-balance mb-12">
                    De ce să alegi DeratPro?
                </h2>

                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {advantages.map((a, i) => {
                        const Icon = icons[i]
                        return (
                            <li key={a.title}>
                                <div className="w-12 h-12 rounded-xl bg-forest text-mustard flex items-center justify-center mb-5">
                                    <Icon size={24} aria-hidden="true" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{a.title}</h3>
                                <p className="text-base text-typography-muted leading-relaxed">{a.description}</p>
                            </li>
                        )
                    })}
                </ul>

                <Stats></Stats>
            </div>
        </section>
    )
}
