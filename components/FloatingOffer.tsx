"use client"

import { useEffect, useState } from "react"
import { ClipboardCheck } from "lucide-react"

// buton "Oferta" care pluteste in coltul din dreapta jos si ramane la scroll.
// apare dupa ce treci de hero (acolo exista deja butonul mare) si dispare cand ajungi la formularul de contact.
export default function FloatingOffer() {
    const [heroVisible, setHeroVisible] = useState(true)
    const [contactVisible, setContactVisible] = useState(false)

    useEffect(() => {
        const hero = document.getElementById("hero")
        const contact = document.getElementById("contact")
        if (!hero || !contact) return

        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.target === hero) setHeroVisible(entry.isIntersecting)
                    if (entry.target === contact) setContactVisible(entry.isIntersecting)
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(hero)
        observer.observe(contact)
        return () => observer.disconnect()
    }, [])

    const shown = !heroVisible && !contactVisible

    return (
        <a
            href="#contact"
            aria-hidden={!shown}
            tabIndex={shown ? 0 : -1}
            className={`fixed z-30 bottom-5 right-5 sm:bottom-8 sm:right-8 inline-flex items-center gap-2 px-5 py-3.5 sm:px-6 sm:py-4 rounded-full bg-mustard hover:bg-mustard-hover text-forest font-bold shadow-xl shadow-black/25 ring-1 ring-black/5 transition-all duration-300 motion-reduce:transition-none ${
                shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
        >
            <ClipboardCheck size={20} aria-hidden="true" />
            Ofertă
        </a>
    )
}
