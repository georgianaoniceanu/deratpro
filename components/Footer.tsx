import { navLinks, contactInfo } from "@/data/date"

export default function Footer() {
    return (
        <footer className="bg-forest text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <a href="#" className="text-2xl font-extrabold tracking-tight">
                        Derat<span className="text-mustard">Pro</span>
                    </a>

                    <nav aria-label="Navigare footer" className="flex flex-wrap justify-center gap-x-8 gap-y-3">
                        {navLinks.map(l => (
                            <a key={l.href} href={l.href} className="text-base text-gray-300 hover:text-white transition-colors">
                                {l.label}
                            </a>
                        ))}
                    </nav>

                    <a href={contactInfo.phoneHref} className="text-base font-semibold text-mustard hover:text-mustard-light transition-colors">
                        {contactInfo.phoneDisplay}
                    </a>
                </div>

                <p className="mt-10 pt-6 border-t border-white/10 text-center md:text-left text-sm text-gray-400">
                    © 2026 DeratPro. Toate drepturile rezervate.
                </p>
            </div>
        </footer>
    )
}
