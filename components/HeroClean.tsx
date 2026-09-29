"use client"

import dynamic from "next/dynamic"

// three.js are nevoie de window si WebGL, deci efectul se incarca doar in browser;
// pana atunci se vede fotografia normala din Hero
const HeroCleanScene = dynamic(() => import("./HeroCleanScene"), { ssr: false })

export default function HeroClean() {
    return <HeroCleanScene />
}
