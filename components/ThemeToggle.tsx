"use client"

import { Moon, Sun } from "lucide-react"

// comuta clasa "dark" pe <html> si tine minte alegerea.
// iconita se schimba din CSS (dark:), deci nu avem nevoie de state si nici de diferente intre server si browser
export default function ThemeToggle() {
    function toggle() {
        const isDark = document.documentElement.classList.toggle("dark")
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
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-forest-surface border border-white/15 text-white hover:text-mustard hover:border-mustard/40 transition-colors"
        >
            {/* pe light mode: luna (treci pe intunecat); pe dark mode: soarele (treci pe luminos) */}
            <Moon size={22} className="dark:hidden" aria-hidden="true" />
            <Sun size={22} className="hidden dark:block" aria-hidden="true" />
        </button>
    )
}
