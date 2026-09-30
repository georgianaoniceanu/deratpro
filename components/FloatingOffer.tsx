"use client"

import { useEffect, useState } from "react"
import { ClipboardCheck } from "lucide-react"

// buton "Oferta" care pluteste in coltul din dreapta jos si ramane la scroll.
// apare dupa ce treci de hero (acolo exista deja butonul mare), dispare cat esti la formularul de contact
// si reapare in footer. pe telefon dispare din nou la partea de jos a footer-ului (copyright + semnatura),
// ca sa nu stea peste ele; pe tableta si desktop ramane, pentru ca acolo textul e centrat si butonul din colt nu il acopera.
export default function FloatingOffer() {
    const [heroVisible, setHeroVisible] = useState(true)
    const [contactVisible, setContactVisible] = useState(false)
    const [footerVisible, setFooterVisible] = useState(false)
    const [bottomVisible, setBottomVisible] = useState(false)

    useEffect(() => {
        const hero = document.getElementById("hero")
        const contact = document.getElementById("contact")
        const footer = document.querySelector("footer")
        const bottom = document.getElementById("footer-bottom") // copyright + semnatura, din Footer.tsx
        if (!hero || !contact || !footer || !bottom) return

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

        // footer-ul si partea lui de jos: reactionam de cum apare primul pixel din ele
        const edgeObserver = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (entry.target === footer) setFooterVisible(entry.isIntersecting)
                if (entry.target === bottom) setBottomVisible(entry.isIntersecting)
            }
        })
        edgeObserver.observe(footer)
        edgeObserver.observe(bottom)

        return () => {
            observer.disconnect()
            edgeObserver.disconnect()
        }
    }, [])

    // la finalul paginii, pe ecrane mari, contactul e inca partial pe ecran cand apare footer-ul:
    // din momentul in care se vede footer-ul, butonul revine
    const shown = !heroVisible && (!contactVisible || footerVisible)
    // doar pe telefon (sub 640px, pragul "sm:" din Tailwind) il ascundem si la finalul footer-ului
    const hiddenOnPhone = shown && bottomVisible

    return (
        <a
            href="#contact"
            aria-hidden={!shown}
            tabIndex={shown ? 0 : -1}
            className={`fixed z-30 bottom-5 right-5 sm:bottom-8 sm:right-8 inline-flex items-center gap-2 px-5 py-3.5 sm:px-6 sm:py-4 rounded-full bg-mustard hover:bg-mustard-hover text-forest font-bold shadow-xl shadow-black/25 ring-1 ring-black/5 transition-all duration-300 motion-reduce:transition-none ${
                shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            } ${hiddenOnPhone ? "max-sm:opacity-0 max-sm:translate-y-4 max-sm:pointer-events-none" : ""}`}
        >
            <ClipboardCheck size={20} aria-hidden="true" />
            Ofertă
        </a>
    )
}
