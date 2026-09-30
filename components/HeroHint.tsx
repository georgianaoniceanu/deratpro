"use client"

import { useEffect, useState } from "react"
import { MousePointer2 } from "lucide-react"

// animatia (HeroCleanScene) anunta prin acest eveniment cand mouse-ul poate sterge poza.
// stau aici, nu in HeroCleanScene, ca indiciul sa nu traga three.js in pachetul principal al paginii
const WIPE_READY_EVENT = "hero-wipe-ready"
export function announceWipeReady() {
    document.documentElement.dataset.heroWipe = "ready" // pentru cine incepe sa asculte mai tarziu
    window.dispatchEvent(new Event(WIPE_READY_EVENT))
}

const WIPE_DISTANCE = 200 // cati pixeli trebuie "sterși" peste hero pana dispare indiciul

// eticheta mica in stanga-jos a hero-ului, ca vizitatorul sa descopere efectul de stergere;
// dispare dupa ce a sters putin din poza (nu la prima miscare, ca sa nu dispara cand cursorul e deja acolo).
// incepe sa numere abia dupa stergerea automata de la inceput, cand mouse-ul chiar poate sterge
export default function HeroHint() {
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        const hero = document.getElementById("hero")
        if (!hero) return

        let distance = 0
        let last: { x: number; y: number } | null = null

        function track(x: number, y: number) {
            const rect = hero!.getBoundingClientRect()
            const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
            if (!inside) {
                last = null
                return
            }
            if (last) distance += Math.hypot(x - last.x, y - last.y)
            last = { x, y }
            if (distance > WIPE_DISTANCE) {
                setHidden(true)
                cleanup()
            }
        }

        const onPointer = (e: PointerEvent) => {
            if (e.pointerType !== "touch") track(e.clientX, e.clientY)
        }
        const onTouch = (e: TouchEvent) => {
            const t = e.touches[0]
            if (t) track(t.clientX, t.clientY)
        }
        function cleanup() {
            window.removeEventListener("pointermove", onPointer)
            window.removeEventListener("touchmove", onTouch)
        }

        function startTracking() {
            window.addEventListener("pointermove", onPointer)
            window.addEventListener("touchmove", onTouch, { passive: true })
        }
        if (document.documentElement.dataset.heroWipe === "ready") startTracking()
        else window.addEventListener(WIPE_READY_EVENT, startTracking, { once: true })

        return () => {
            window.removeEventListener(WIPE_READY_EVENT, startTracking)
            cleanup()
        }
    }, [])

    return (
        <p
            aria-hidden="true"
            // jos, in stanga, aliniat cu textul din hero (acelasi max-w-7xl + px-12). doar pe ecrane late (>= 1024px) cu mouse;
            // pe ecrane tactile nu apare,
            // acolo stergerea e automata
            className={`pointer-events-none absolute bottom-10 left-[max(3rem,calc((100%-80rem)/2+3rem))] hidden lg:[@media(pointer:fine)]:flex whitespace-nowrap items-center gap-2 rounded-full bg-forest/75 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 shadow-lg shadow-black/20 transition-opacity duration-700 ${hidden ? "opacity-0" : "opacity-100"}`}
        >
            <MousePointer2 size={18} className="text-mustard motion-safe:animate-pulse" />
            <span>Treci cu mouse-ul peste imagine ca să o cureți</span>
        </p>
    )
}
