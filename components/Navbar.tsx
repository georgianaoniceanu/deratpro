"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Menu, X, ChevronRight, Phone } from "lucide-react"
import { navLinks, contactInfo } from "../data/date"
import ThemeToggle from "./ThemeToggle"

export default function Navbar() {
    const [openMenu, setOpenMenu] = useState(false)

    // inchide meniul la tasta Escape
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpenMenu(false)
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    // blocheaza scroll-ul paginii cat timp meniul e deschis
    useEffect(() => {
        document.body.style.overflow = openMenu ? "hidden" : ""

        return () => {
            document.body.style.overflow = ""
        }
    }, [openMenu])

    return (
        // ramane lipit sus cand derulezi pagina, ca meniul si butonul de oferta sa fie mereu la indemana.
        // fara backdrop-blur: ar strica meniul mobil (care e "fixed" pe tot ecranul).
        // culorile vin din tema (sand-light, typography): crem in light mode, verde foarte inchis in dark mode
        <header className="sticky top-0 z-40 bg-sand-light text-typography shadow-sm shadow-black/5 dark:shadow-lg dark:shadow-black/20">
            {/* inaltimea vine din variabila --nav-h (globals.css), aceeasi pe care o scade hero-ul */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-(--nav-h) flex items-center justify-between border-b border-sand-dark">
                <a href="#" className="flex items-center gap-3.5">
                    {/* alt gol: logo-ul e decorativ, numele e scris imediat langa el */}
                    <Image src="/logo.svg" alt="" width={48} height={48} priority className="w-12 h-12" />
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-forest dark:text-white">
                        {/* pe fundal deschis, mustarul e prea slab ca contrast; folosim auriul mai inchis, ca in restul site-ului */}
                        Derat<span className="text-[#9A6410] dark:text-mustard">Pro</span>
                    </span>
                </a>

                <nav aria-label="Navigare principală" className="hidden lg:flex items-center gap-9">
                    {navLinks.map(l => (
                        <a
                            key={l.href}
                            href={l.href}
                            className="text-lg font-semibold text-typography-muted hover:text-forest dark:hover:text-white transition-colors"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        aria-expanded={openMenu}
                        aria-controls="mobile-menu"
                        aria-label={openMenu ? "Închide meniul" : "Deschide meniul"}
                        className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-forest-surface border border-sand-dark dark:border-white/15 text-forest dark:text-white hover:text-[#9A6410] dark:hover:text-mustard hover:border-mustard/60 transition-colors"
                    >
                        <Menu size={24} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {openMenu && (
                <nav
                    id="mobile-menu"
                    aria-label="Meniu mobil"
                    className="lg:hidden fixed inset-0 z-50 bg-sand-light/95 text-typography backdrop-blur-xl flex flex-col justify-between p-6 sm:p-8 overflow-y-auto"
                >
                    <div>
                        <div className="flex items-center justify-between pb-6 border-b border-sand-dark">
                            <a href="#" onClick={() => setOpenMenu(false)} className="flex items-center gap-3.5">
                                <Image src="/logo.svg" alt="" width={44} height={44} className="w-11 h-11" />
                                <span className="text-2xl font-extrabold tracking-tight text-forest dark:text-white">
                                    Derat<span className="text-[#9A6410] dark:text-mustard">Pro</span>
                                </span>
                            </a>
                            <button
                                onClick={() => setOpenMenu(false)}
                                aria-label="Închide meniul"
                                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-forest-surface border border-sand-dark dark:border-white/15 text-forest dark:text-white hover:text-[#9A6410] dark:hover:text-mustard hover:border-mustard/60 transition-colors"
                            >
                                <X size={24} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="flex flex-col pt-2">
                            {navLinks.map(l => (
                                <a
                                    key={l.href}
                                    href={l.href}
                                    onClick={() => setOpenMenu(false)}
                                    className="flex items-center justify-between py-5 border-b border-sand-dark text-xl sm:text-2xl font-bold text-forest dark:text-white hover:text-[#9A6410] dark:hover:text-mustard transition-colors"
                                >
                                    <span>{l.label}</span>
                                    <ChevronRight size={20} className="text-typography-muted" aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 border-t border-sand-dark flex flex-col items-center gap-4">
                        <a
                            href="#contact"
                            onClick={() => setOpenMenu(false)}
                            className="w-full sm:w-auto sm:px-12 py-4 text-center bg-mustard hover:bg-mustard-hover text-forest font-bold rounded-xl transition shadow-lg shadow-mustard/20"
                        >
                            Ofertă gratuită
                        </a>
                        <a
                            href={contactInfo.phoneHref}
                            className="flex items-center gap-2 text-typography-muted hover:text-forest dark:hover:text-white font-semibold transition-colors"
                        >
                            <Phone size={16} className="text-[#9A6410] dark:text-mustard" aria-hidden="true" />
                            {contactInfo.phoneDisplay}
                        </a>
                    </div>
                </nav>
            )}
        </header>
    )
}