import { Phone, Mail } from "lucide-react"
import { navLinks, contactInfo } from "@/data/date"

// iconite de brand desenate ca SVG (lucide nu mai include logo-uri de branduri)
const socials = [
    {
        label: "Instagram",
        href: "#",
        icon: (
            <>
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <circle cx="12" cy="12" r="3" />
                <path d="M16.5 7.5v.01" />
            </>
        ),
    },
    {
        label: "Facebook",
        href: "#",
        icon: <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />,
    },
    {
        label: "TikTok",
        href: "#",
        icon: <path d="M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" />,
    },
]

const titleClass = "text-lg font-extrabold text-mustard mb-5"

export default function Footer() {
    return (
        <footer className="bg-forest text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
                    <div>
                        <a href="#" className="text-3xl font-extrabold tracking-tight">
                            Derat<span className="text-mustard">Pro</span>
                        </a>
                        <p className="mt-4 text-base text-gray-300 leading-relaxed max-w-xs">
                            Deratizare, dezinsecție și dezinfecție pentru locuințe și spații comerciale.
                        </p>
                    </div>

                    <nav aria-label="Navigare footer">
                        <h2 className={titleClass}>Navighează</h2>
                        <ul className="flex flex-col gap-3">
                            {navLinks.map(l => (
                                <li key={l.href}>
                                    <a href={l.href} className="text-base text-gray-300 hover:text-white transition-colors">
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div>
                        <h2 className={titleClass}>Contact</h2>
                        <ul className="flex flex-col gap-4">
                            <li>
                                <a href={contactInfo.phoneHref} className="flex items-center gap-3 text-base font-semibold hover:text-mustard transition-colors">
                                    <span className="w-10 h-10 shrink-0 rounded-xl bg-forest-surface border border-white/15 flex items-center justify-center text-mustard">
                                        <Phone size={18} aria-hidden="true" />
                                    </span>
                                    {contactInfo.phoneDisplay}
                                </a>
                            </li>
                            <li>
                                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-3 text-base font-semibold hover:text-mustard transition-colors">
                                    <span className="w-10 h-10 shrink-0 rounded-xl bg-forest-surface border border-white/15 flex items-center justify-center text-mustard">
                                        <Mail size={18} aria-hidden="true" />
                                    </span>
                                    {contactInfo.email}
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className={titleClass}>Urmărește-ne</h2>
                        <ul className="flex gap-3">
                            {socials.map(s => (
                                <li key={s.label}>
                                    <a
                                        href={s.href}
                                        aria-label={s.label}
                                        className="w-12 h-12 rounded-xl bg-forest-surface border border-white/15 flex items-center justify-center text-white hover:text-mustard hover:border-mustard/50 transition-colors"
                                    >
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            {s.icon}
                                        </svg>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <p className="mt-12 pt-6 border-t border-white/10 text-sm text-gray-400">
                    © 2026 DeratPro. Toate drepturile rezervate.
                </p>
            </div>
        </footer>
    )
}
