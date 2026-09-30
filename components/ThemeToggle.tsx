"use client"

import { Moon, Sun } from "lucide-react"

// comuta clasa "dark" pe <html> si tine minte alegerea.
// iconita se schimba din CSS (dark:), deci nu avem nevoie de state si nici de diferente intre server si browser
export default function ThemeToggle() {
    function toggle() {
        const html = document.documentElement
        // fara tranzitii pe durata schimbarii: altfel elementele cu transition-colors ramaneau o clipa in tema veche
        html.classList.add("theme-switching")
        const isDark = html.classList.toggle("dark")
        // le repornim dupa ce browserul a desenat tema noua (doua cadre, ca sa fim siguri)
        requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("theme-switching")))
        try {
            localStorage.setItem("theme", isDark ? "dark" : "light")
        } catch {
            // localStorage poate fi blocat (ex. mod privat); tema merge si fara sa fie salvata
        }
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label="Comută modul întunecat"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-forest-surface border border-sand-dark dark:border-white/15 text-forest dark:text-white hover:text-[#9A6410] dark:hover:text-mustard hover:border-mustard/60 transition-colors"
        >
            {/* pe light mode: luna (treci pe intunecat); pe dark mode: soarele (treci pe luminos) */}
            <Moon size={22} className="dark:hidden" aria-hidden="true" />
            <Sun size={22} className="hidden dark:block" aria-hidden="true" />
        </button>
    )
}
