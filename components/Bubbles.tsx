"use client"

import dynamic from "next/dynamic"

// three.js are nevoie de window si WebGL, deci scena se incarca doar in browser
const BubblesScene = dynamic(() => import("./BubblesScene"), { ssr: false })

export default function Bubbles() {
    return <BubblesScene />
}
