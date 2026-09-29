"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import * as THREE from "three"

// dimensiunile fotografiei din public/hero-bg.jpg (pentru incadrarea de tip "cover")
const PHOTO_ASPECT = 2400 / 2053
const BRUSH_PX = 70 // raza "buretelui" in pixeli de ecran

// un dreptunghi care acopera tot canvas-ul, fara camera
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// fotografia apare stearsa si cetoasa; unde masca e alba (pe unde a trecut mouse-ul) apare curata
const fragmentShader = `
  uniform sampler2D uPhoto;
  uniform sampler2D uMask;
  uniform vec2 uScale;
  uniform vec2 uOffset;
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 photo = texture2D(uPhoto, vUv * uScale + uOffset).rgb;

    // varianta "murdara": fara culoare, mai intunecata, cu o ceata care se misca incet
    float gray = dot(photo, vec3(0.299, 0.587, 0.114));
    float haze = fbm(vec2(vUv.x * uAspect, vUv.y) * 3.0 + vec2(uTime * 0.03, uTime * 0.015));
    vec3 dirty = mix(vec3(gray), vec3(0.62, 0.6, 0.52), 0.5) * 0.7 + haze * 0.12;

    // varianta curata: culorile reale, putin mai luminoase
    vec3 clean = photo * 1.08;

    float m = smoothstep(0.05, 0.7, texture2D(uMask, vUv).r);
    vec3 color = mix(dirty, clean, m);

    // o dunga luminoasa discreta pe marginea zonei curatate, ca un luciu
    color += m * (1.0 - m) * 0.35;

    gl_FragColor = vec4(color, 1.0);
  }
`

function CleanPlane() {
    const { size, gl } = useThree()
    const photo = useLoader(THREE.TextureLoader, "/hero-bg.jpg")
    const reduceMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, [])

    // valorile initiale trimise shader-ului; le modificam apoi prin materialRef
    const [uniforms] = useState(() => ({
        uPhoto: { value: photo },
        uMask: { value: null as THREE.Texture | null },
        uScale: { value: new THREE.Vector2(1, 1) },
        uOffset: { value: new THREE.Vector2(0, 0) },
        uAspect: { value: 1 },
        uTime: { value: 0 },
    }))

    const materialRef = useRef<THREE.ShaderMaterial>(null)
    // masca: un canvas 2D in care desenam cu alb pe unde trece mouse-ul; negru = murdar
    const maskRef = useRef<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture } | null>(null)
    const pending = useRef<{ x: number; y: number }[]>([]) // puncte noi, in pixeli de ecran relativi la canvas
    const last = useRef<{ x: number; y: number } | null>(null)
    const start = useRef<number | null>(null)

    useEffect(() => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!
        const texture = new THREE.CanvasTexture(canvas)
        maskRef.current = { canvas, ctx, texture }
        if (materialRef.current) materialRef.current.uniforms.uMask.value = texture
        return () => texture.dispose()
    }, [])

    // la redimensionare: masca are aceeasi proportie ca hero-ul, iar poza e incadrata ca "object-cover"
    useEffect(() => {
        const mask = maskRef.current
        const material = materialRef.current
        if (!mask || !material) return

        mask.canvas.width = 512
        mask.canvas.height = Math.max(1, Math.round((512 * size.height) / size.width))
        mask.ctx.fillStyle = "black"
        mask.ctx.fillRect(0, 0, mask.canvas.width, mask.canvas.height)
        // canvas-ul si-a schimbat dimensiunea: textura trebuie realocata pe placa video, nu doar actualizata
        mask.texture.dispose()
        mask.texture.needsUpdate = true

        const canvasAspect = size.width / size.height
        const u = material.uniforms
        u.uAspect.value = canvasAspect
        if (canvasAspect > PHOTO_ASPECT) {
            // hero mai lat decat poza: taiem sus/jos, pastrand zona de la ~35% de sus
            u.uScale.value.set(1, PHOTO_ASPECT / canvasAspect)
            u.uOffset.value.set(0, (1 - u.uScale.value.y) * 0.65)
        } else {
            // hero mai ingust: taiem din stanga, poza ramane lipita de dreapta (unde e tehnicianul)
            u.uScale.value.set(canvasAspect / PHOTO_ASPECT, 1)
            u.uOffset.value.set(1 - u.uScale.value.x, 0)
        }
    }, [size])

    // mouse / deget: canvas-ul e sub text, asa ca ascultam pe window si verificam daca e peste hero
    useEffect(() => {
        function onMove(e: PointerEvent) {
            const rect = gl.domElement.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                last.current = null
                return
            }
            pending.current.push({ x, y })
        }
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerdown", onMove)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerdown", onMove)
        }
    }, [gl])

    useFrame(state => {
        const mask = maskRef.current
        const material = materialRef.current
        if (!mask || !material) return
        const { ctx, canvas, texture } = mask
        const t = state.clock.elapsedTime
        material.uniforms.uTime.value = t
        if (start.current === null) start.current = t

        // la incarcare, o "stergere" automata pe partea dreapta, ca vizitatorul sa vada efectul
        const intro = (t - start.current) / 1.8
        if (!reduceMotion && intro <= 1) {
            const x = size.width * (0.5 + 0.45 * intro)
            const y = size.height * (0.72 - 0.45 * intro + Math.sin(intro * Math.PI * 3) * 0.08)
            pending.current.push({ x, y })
        }

        // zonele curatate se "murdaresc" incet la loc (fara umbra, altfel s-ar desena si ea)
        ctx.shadowBlur = 0
        ctx.fillStyle = `rgba(0, 0, 0, ${reduceMotion ? 0.004 : 0.008})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // desenam traseul mouse-ului ca linii albe, moi; pe ecrane mici buretele e proportional mai mic
        const k = canvas.width / size.width
        const brush = Math.min(BRUSH_PX, size.width * 0.09)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.lineWidth = brush * 2 * k
        ctx.shadowColor = "white"
        ctx.shadowBlur = brush * k
        for (const p of pending.current) {
            const from = last.current ?? p
            ctx.beginPath()
            ctx.moveTo(from.x * k, from.y * k)
            ctx.lineTo(p.x * k + 0.01, p.y * k)
            ctx.stroke()
            last.current = p
        }
        pending.current = []
        texture.needsUpdate = true
    })

    return (
        <mesh frustumCulled={false}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial ref={materialRef} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
        </mesh>
    )
}

export default function HeroCleanScene() {
    return (
        <Canvas
            // fara conversii de culoare: poza apare exact cum e in fisier
            flat
            linear
            dpr={[1, 1.5]}
            gl={{ antialias: false }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            aria-hidden="true"
        >
            <CleanPlane />
        </Canvas>
    )
}
