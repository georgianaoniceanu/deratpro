"use client"

import { useEffect, useState } from "react"
import { Hand, MousePointer2 } from "lucide-react"

const WIPE_DISTANCE = 200 // cati pixeli trebuie "sterși" peste hero pana dispare indiciul

// indiciu mic sub butoane, ca vizitatorul sa descopere efectul de stergere;
// dispare dupa ce a sters putin din poza (nu la prima miscare, ca sa nu dispara cand cursorul e deja acolo)
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

        window.addEventListener("pointermove", onPointer)
        window.addEventListener("touchmove", onTouch, { passive: true })
        return cleanup
    }, [])

    return (
        <p
            aria-hidden="true"
            className={`mt-8 flex items-center gap-2 text-sm text-gray-300 transition-opacity duration-700 ${hidden ? "opacity-0" : "opacity-100"}`}
        >
            {/* pe dispozitive cu mouse: cursor; pe ecrane tactile: mana */}
            <MousePointer2 size={18} className="text-mustard motion-safe:animate-pulse [@media(pointer:coarse)]:hidden" />
            <Hand size={18} className="hidden text-mustard motion-safe:animate-pulse [@media(pointer:coarse)]:block" />
            <span className="[@media(pointer:coarse)]:hidden">Trece cu mouse-ul peste imagine ca să o cureți</span>
            <span className="hidden [@media(pointer:coarse)]:inline">Glisează peste imagine ca să o cureți</span>
        </p>
    )
}
