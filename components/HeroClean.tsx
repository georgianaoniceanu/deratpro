"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// three.js are nevoie de window si WebGL, deci efectul se incarca doar in browser;
// pana atunci se vede fotografia normala din Hero
const HeroCleanScene = dynamic(() => import("./HeroCleanScene"), { ssr: false })

export default function HeroClean() {
    const [ready, setReady] = useState(false)

    // pornim efectul abia dupa ce pagina s-a incarcat si browserul e liber:
    // pe telefoane, three.js + compilarea shader-ului ar bloca pagina exact la deschidere
    useEffect(() => {
        let idleId: number | undefined
        let timeoutId: ReturnType<typeof setTimeout> | undefined

        const start = () => {
            if ("requestIdleCallback" in window) {
                idleId = window.requestIdleCallback(() => setReady(true), { timeout: 2500 })
            } else {
                timeoutId = setTimeout(() => setReady(true), 1200)
            }
        }

        if (document.readyState === "complete") start()
        else window.addEventListener("load", start, { once: true })

        return () => {
            window.removeEventListener("load", start)
            if (idleId !== undefined) window.cancelIdleCallback(idleId)
            if (timeoutId !== undefined) clearTimeout(timeoutId)
        }
    }, [])

    if (!ready) return null

    // efectul apare lin peste fotografie, nu brusc
    return (
        <div className="absolute inset-0 animate-fade-in motion-reduce:animate-none">
            <HeroCleanScene />
        </div>
    )
}
