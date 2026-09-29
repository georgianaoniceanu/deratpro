"use client"

import { useState, useEffect } from "react"
import { navLinks, contactInfo } from "../data/date"

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
        <header>
            <a href="#">DeratPro</a>

            <nav aria-label="Navigare principală">
                {navLinks.map(l => (
                    <a key={l.href} href={l.href}>{l.label}</a>
                ))}
            </nav>

            <a href="#contact">Ofertă gratuită</a>

            <button
                onClick={() => setOpenMenu(!openMenu)}
                aria-expanded={openMenu}
                aria-controls="mobile-menu"
                aria-label={openMenu ? "Închide meniul" : "Deschide meniul"}
            >
                Meniu
            </button>

            {openMenu && (
                <nav id="mobile-menu" aria-label="Meniu mobil">
                    <a href="#" onClick={() => setOpenMenu(false)}>DeratPro</a>
                    <button onClick={() => setOpenMenu(false)} aria-label="Închide meniul">
                        X
                    </button>

                    {navLinks.map(l => (
                        <a key={l.href} href={l.href} onClick={() => setOpenMenu(false)}>
                            {l.label}
                        </a>
                    ))}

                    <a href="#contact" onClick={() => setOpenMenu(false)}>Ofertă gratuită</a>
                    <a href={contactInfo.phoneHref}>{contactInfo.phoneDisplay}</a>
                </nav>
            )}
        </header>
    )
}