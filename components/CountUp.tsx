"use client"

import { useEffect, useRef } from "react"

const DURATION = 1600 // ms
const format = new Intl.NumberFormat("ro-RO") // 10000 -> "10.000"

// imparte o valoare ca "10.000+" sau "30 zile" in: numar + textul din fata/spate
function parse(value: string) {
    const match = value.match(/^(\D*)([\d.]+)(.*)$/)
    if (!match) return null
    return { prefix: match[1], target: Number(match[2].replace(/\./g, "")), suffix: match[3] }
}

export default function CountUp({ value }: { value: string }) {
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const el = ref.current
        const parsed = parse(value)
        if (!el || !parsed) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

        const { prefix, target, suffix } = parsed
        const show = (n: number) => {
            el.textContent = `${prefix}${format.format(n)}${suffix}`
        }
        let frame = 0

        // cifra porneste de la 0 si numara abia cand cardul intra pe ecran.
        // actualizam textul direct in DOM (fara state), ca sa nu re-randam componenta la fiecare cadru
        show(0)
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return
                observer.disconnect()
                const start = performance.now()
                const tick = (now: number) => {
                    const progress = Math.min((now - start) / DURATION, 1)
                    const eased = 1 - Math.pow(1 - progress, 3) // porneste repede si incetineste la final
                    show(Math.round(target * eased))
                    if (progress < 1) frame = requestAnimationFrame(tick)
                }
                frame = requestAnimationFrame(tick)
            },
            { threshold: 0.4 }
        )
        observer.observe(el)

        return () => {
            observer.disconnect()
            cancelAnimationFrame(frame)
            show(target)
        }
    }, [value])

    return (
        <>
            {/* cititoarele de ecran citesc direct valoarea finala, nu fiecare numar intermediar */}
            <span className="sr-only">{value}</span>
            {/* pe server si fara JavaScript se vede direct valoarea finala */}
            <span ref={ref} aria-hidden="true" className="tabular-nums">
                {value}
            </span>
        </>
    )
}
