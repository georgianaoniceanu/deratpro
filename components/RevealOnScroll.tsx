"use client"

import { useEffect } from "react"

// urmareste toate elementele marcate cu data-reveal si le adauga clasa "is-visible"
// cand intra pe ecran; animatiile propriu-zise sunt in globals.css.
// asa sectiunile raman componente server: doar pun un atribut pe elemente.
export default function RevealOnScroll() {
    useEffect(() => {
        const elements = document.querySelectorAll("[data-reveal]")
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue
                    entry.target.classList.add("is-visible")
                    observer.unobserve(entry.target) // animatia ruleaza o singura data
                }
            },
            { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
        )
        elements.forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [])

    return null
}
