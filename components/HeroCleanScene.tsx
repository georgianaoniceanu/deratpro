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

// fotografia apare murdara (tenta maronie, pete, praf, urme si o ceata usoara);
// unde masca e alba (pe unde a trecut mouse-ul) apare curata
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

  // puncte mici de praf: o grila in care doar unele celule au un punct, la pozitie si marime aleatorii
  float specks(vec2 p, float scale, float density) {
    vec2 g = p * scale;
    vec2 cell = floor(g);
    vec2 f = fract(g) - 0.5;
    vec2 jitter = vec2(hash(cell + 1.7), hash(cell + 9.2)) - 0.5;
    float r = mix(0.08, 0.22, hash(cell + 4.4));
    float on = step(1.0 - density, hash(cell + 2.3));
    return on * smoothstep(r, r * 0.4, length(f - jitter * 0.5));
  }

  void main() {
    vec3 photo = texture2D(uPhoto, vUv * uScale + uOffset).rgb;
    vec2 p = vec2(vUv.x * uAspect, vUv.y); // coordonate fara deformare (cercurile raman cercuri)

    // 1. baza murdara: culori stinse, cu o tenta calda maronie, mai intunecata
    float gray = dot(photo, vec3(0.299, 0.587, 0.114));
    vec3 dirty = mix(photo, vec3(gray) * vec3(1.0, 0.92, 0.78), 0.75) * 0.72;

    // 2. pete mari, neregulate, ca apa uscata sau mizerie depusa
    float stains = smoothstep(0.52, 0.72, fbm(p * 2.2 + 7.3));
    dirty = mix(dirty, dirty * vec3(0.72, 0.62, 0.48), stains * 0.65);

    // 3. urme diagonale sterse, ca dupa o carpa murdara
    float streaks = smoothstep(0.55, 0.8, fbm(vec2(p.x + p.y * 0.6, p.y * 0.25) * 6.0));
    dirty *= 1.0 - streaks * 0.18;

    // 4. praf: puncte inchise de doua marimi
    float dust = max(specks(p, 38.0, 0.18), specks(p + 3.1, 90.0, 0.12) * 0.8);
    dirty = mix(dirty, vec3(0.16, 0.13, 0.09), dust * 0.55);

    // 5. o ceata usoara care se misca incet
    float haze = fbm(p * 3.0 + vec2(uTime * 0.03, uTime * 0.015));
    dirty += haze * 0.07;

    // varianta curata: culorile reale, putin mai luminoase
    vec3 clean = photo * 1.08;

    float m = smoothstep(0.05, 0.7, texture2D(uMask, vUv).r);
    vec3 color = mix(dirty, clean, m);

    // o dunga luminoasa discreta pe marginea zonei curatate, ca un luciu
    color += m * (1.0 - m) * 0.35;

    gl_FragColor = vec4(color, 1.0);
  }
`

// ---------- scantei pe urma buretelui ----------
const SPARKS = 48 // cate scantei pot exista in acelasi timp (le refolosim prin rotatie)
const SPARK_EVERY_PX = 26 // o scanteie noua la fiecare ~26px sterși

// punctele sunt date direct in coordonate de ecran (-1..1), fara camera, ca si poza
const sparkVertexShader = `
  attribute float aAlpha;
  attribute float aSize;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_Position = vec4(position.xy, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio;
  }
`
// o stea cu 4 colturi: doua raze subtiri in cruce + un miez luminos
const sparkFragmentShader = `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float rays = clamp(0.012 / (abs(c.x * c.y) + 0.0015), 0.0, 1.0);
    float fade = 1.0 - smoothstep(0.15, 0.5, length(c));
    float core = smoothstep(0.12, 0.0, length(c));
    float shape = max(rays * fade, core);
    gl_FragColor = vec4(vec3(1.0, 0.95, 0.8) * shape, shape * vAlpha);
  }
`

type SparkData = {
    geometry: THREE.BufferGeometry
    positions: Float32Array
    alphas: Float32Array
    sizes: Float32Array
    life: Float32Array // 0..1 = cat a trait; >= 1 = stinsa
    duration: Float32Array
    baseSize: Float32Array
    next: number
    travelled: number
}

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
    const sparkPoints = useRef<THREE.Points>(null)
    const sparks = useRef<SparkData | null>(null)
    const [sparkUniforms] = useState(() => ({ uPixelRatio: { value: 1 } }))

    // geometria scanteilor: o cream o singura data si o atasam la <points>; apoi doar ii schimbam valorile
    useEffect(() => {
        const positions = new Float32Array(SPARKS * 3)
        const alphas = new Float32Array(SPARKS)
        const sizes = new Float32Array(SPARKS)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1))
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
        sparks.current = {
            geometry,
            positions,
            alphas,
            sizes,
            life: new Float32Array(SPARKS).fill(1),
            duration: new Float32Array(SPARKS).fill(1),
            baseSize: new Float32Array(SPARKS),
            next: 0,
            travelled: 0,
        }
        if (sparkPoints.current) {
            sparkPoints.current.geometry = geometry
            ;(sparkPoints.current.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = gl.getPixelRatio()
        }
        return () => geometry.dispose()
    }, [gl])

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
        function addPoint(clientX: number, clientY: number) {
            const rect = gl.domElement.getBoundingClientRect()
            const x = clientX - rect.left
            const y = clientY - rect.top
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                last.current = null
                return
            }
            pending.current.push({ x, y })
        }
        const onPointer = (e: PointerEvent) => {
            if (e.pointerType === "mouse" || e.pointerType === "pen") addPoint(e.clientX, e.clientY)
        }
        // pe telefon, cand tragi cu degetul browserul deruleaza pagina si opreste evenimentele "pointer";
        // evenimentele "touch" continua si in timpul derularii, deci le folosim pe ele pentru deget
        const onTouch = (e: TouchEvent) => {
            const touch = e.touches[0]
            if (touch) addPoint(touch.clientX, touch.clientY)
        }
        const onTouchEnd = () => {
            last.current = null
        }

        window.addEventListener("pointermove", onPointer)
        window.addEventListener("pointerdown", onPointer)
        window.addEventListener("touchstart", onTouch, { passive: true })
        window.addEventListener("touchmove", onTouch, { passive: true })
        window.addEventListener("touchend", onTouchEnd)
        return () => {
            window.removeEventListener("pointermove", onPointer)
            window.removeEventListener("pointerdown", onPointer)
            window.removeEventListener("touchstart", onTouch)
            window.removeEventListener("touchmove", onTouch)
            window.removeEventListener("touchend", onTouchEnd)
        }
    }, [gl])

    useFrame((state, delta) => {
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
        const brush = Math.min(BRUSH_PX, size.width * 0.13)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.lineWidth = brush * 2 * k
        ctx.shadowColor = "white"
        ctx.shadowBlur = brush * k
        const sp = sparks.current
        for (const p of pending.current) {
            const from = last.current ?? p
            ctx.beginPath()
            ctx.moveTo(from.x * k, from.y * k)
            ctx.lineTo(p.x * k + 0.01, p.y * k)
            ctx.stroke()

            // pe masura ce buretele avanseaza, lasam in urma cate o scanteie
            if (sp && !reduceMotion) {
                sp.travelled += Math.hypot(p.x - from.x, p.y - from.y)
                while (sp.travelled > SPARK_EVERY_PX) {
                    sp.travelled -= SPARK_EVERY_PX
                    const i = sp.next
                    sp.next = (sp.next + 1) % SPARKS
                    // pozitie aleatorie in zona sterse, transformata din pixeli in coordonate de ecran (-1..1)
                    const angle = Math.random() * Math.PI * 2
                    const dist = Math.random() * brush * 0.9
                    const sx = p.x + Math.cos(angle) * dist
                    const sy = p.y + Math.sin(angle) * dist
                    sp.positions[i * 3] = (sx / size.width) * 2 - 1
                    sp.positions[i * 3 + 1] = 1 - (sy / size.height) * 2
                    sp.life[i] = 0
                    sp.duration[i] = 0.6 + Math.random() * 0.6
                    sp.baseSize[i] = 14 + Math.random() * 18
                }
            }
            last.current = p
        }
        pending.current = []
        texture.needsUpdate = true

        // scanteile apar, clipesc si se sting
        if (sp) {
            const dt = Math.min(delta, 0.05)
            for (let i = 0; i < SPARKS; i++) {
                if (sp.life[i] >= 1) {
                    sp.alphas[i] = 0
                    continue
                }
                sp.life[i] = Math.min(1, sp.life[i] + dt / sp.duration[i])
                const glow = Math.sin(sp.life[i] * Math.PI) // 0 -> 1 -> 0
                sp.alphas[i] = glow
                sp.sizes[i] = sp.baseSize[i] * (0.4 + 0.6 * glow)
            }
            sp.geometry.attributes.position.needsUpdate = true
            sp.geometry.attributes.aAlpha.needsUpdate = true
            sp.geometry.attributes.aSize.needsUpdate = true
        }
    })

    return (
        <>
            <mesh frustumCulled={false}>
                <planeGeometry args={[2, 2]} />
                <shaderMaterial ref={materialRef} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
            </mesh>

            {/* scanteile se desenează peste poza; geometria e atasata din useEffect */}
            <points ref={sparkPoints} frustumCulled={false} renderOrder={1}>
                <shaderMaterial
                    vertexShader={sparkVertexShader}
                    fragmentShader={sparkFragmentShader}
                    uniforms={sparkUniforms}
                    transparent
                    depthWrite={false}
                    depthTest={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </>
    )
}

export default function HeroCleanScene() {
    const wrapper = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(true)
    // pe telefoane (ecran tactil) desenam la rezolutie mai mica: diferenta nu se vede, dar consuma mult mai putin
    const [maxDpr] = useState(() => (window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5))

    // animatia ruleaza doar cat timp hero-ul e pe ecran; dupa scroll se opreste si nu mai consuma baterie
    useEffect(() => {
        const el = wrapper.current
        if (!el) return
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <div ref={wrapper} className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <Canvas
                // fara conversii de culoare: poza apare exact cum e in fisier
                flat
                linear
                dpr={[1, maxDpr]}
                frameloop={visible ? "always" : "never"}
                gl={{ antialias: false }}
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
                <CleanPlane />
            </Canvas>
        </div>
    )
}
