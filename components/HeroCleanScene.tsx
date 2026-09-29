"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import * as THREE from "three"

// dimensiunile fotografiei din public/hero-bg.jpg (pentru incadrarea de tip "cover")
const PHOTO_ASPECT = 2400 / 2053
const BRUSH_PX = 70 // raza "buretelui" in pixeli de ecran
const IDLE_AFTER = 10 // secunde fara stergere dupa care masca e sigur complet murdara (nu mai o actualizam)

// un dreptunghi care acopera tot canvas-ul, fara camera
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// cod GLSL comun: incadrarea pozei si functiile de zgomot
const shaderCommon = `
  uniform sampler2D uPhoto;
  uniform vec2 uScale;
  uniform vec2 uOffset;
  varying vec2 vUv;

  vec3 samplePhoto() { return texture2D(uPhoto, vUv * uScale + uOffset).rgb; }

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
`

// 1) "coacerea" murdariei: se ruleaza O SINGURA DATA (si la redimensionare), iar rezultatul se salveaza intr-o textura.
// pe telefoane, sa calculam petele si praful pentru fiecare pixel la fiecare cadru era prea greu
const bakeFragmentShader = `
  uniform float uAspect;
  ${shaderCommon}

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
    vec3 photo = samplePhoto();
    vec2 p = vec2(vUv.x * uAspect, vUv.y); // coordonate fara deformare (cercurile raman cercuri)

    // baza murdara: culori stinse, cu o tenta calda maronie, mai intunecata
    float gray = dot(photo, vec3(0.299, 0.587, 0.114));
    vec3 dirty = mix(photo, vec3(gray) * vec3(1.0, 0.92, 0.78), 0.75) * 0.72;

    // pete mari, neregulate, ca apa uscata sau mizerie depusa
    float stains = smoothstep(0.52, 0.72, fbm(p * 2.2 + 7.3));
    dirty = mix(dirty, dirty * vec3(0.72, 0.62, 0.48), stains * 0.65);

    // urme diagonale sterse, ca dupa o carpa murdara
    float streaks = smoothstep(0.55, 0.8, fbm(vec2(p.x + p.y * 0.6, p.y * 0.25) * 6.0));
    dirty *= 1.0 - streaks * 0.18;

    // praf: puncte inchise de doua marimi
    float dust = max(specks(p, 38.0, 0.18), specks(p + 3.1, 90.0, 0.12) * 0.8);
    dirty = mix(dirty, vec3(0.16, 0.13, 0.09), dust * 0.55);

    // o ceata usoara, fixa
    dirty += fbm(p * 3.0) * 0.07;

    gl_FragColor = vec4(dirty, 1.0);
  }
`

// 2) shader-ul de la fiecare cadru: doar citeste 3 texturi si le amesteca, deci e foarte ieftin
const fragmentShader = `
  uniform sampler2D uDirty;
  uniform sampler2D uMask;
  uniform float uWide; // 1 = desktop (strat verde de la stanga la dreapta), 0 = telefon/tableta (de sus in jos)
  uniform vec3 uForest; // verdele inchis al site-ului
  ${shaderCommon}

  void main() {
    vec3 clean = samplePhoto() * 1.08; // culorile reale, putin mai luminoase
    vec3 dirty = texture2D(uDirty, vUv).rgb;

    float m = smoothstep(0.05, 0.6, texture2D(uMask, vUv).r);
    vec3 color = mix(dirty, clean, m);

    // o dunga luminoasa discreta pe marginea zonei curatate, ca un luciu
    color += m * (1.0 - m) * 0.35;

    // stratul verde peste poza (ca textul alb sa se citeasca), calculat aici ca sa se deschida pe unde stergi:
    // desktop: plin in stanga (sub text), tot mai transparent spre dreapta
    // telefon: mai inchis sus (sub titlu), mai transparent jos
    float wide = mix(1.0, 0.85, smoothstep(0.0, 0.5, vUv.x)) - smoothstep(0.5, 1.0, vUv.x) * 0.55;
    float tall = mix(0.45, 0.85, smoothstep(0.0, 1.0, vUv.y));
    float overlay = mix(tall, wide, uWide);
    overlay *= 1.0 - m * 0.5;
    color = mix(color, uForest, overlay);

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

type MaskData = {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    texture: THREE.CanvasTexture
    brush: HTMLCanvasElement // "pensula": un cerc alb estompat, desenat o singura data
    frame: number
    lastWipe: number // cand s-a sters ultima data (secunde)
    changed: boolean
}

type BakeData = {
    target: THREE.WebGLRenderTarget
    scene: THREE.Scene
    camera: THREE.Camera
    material: THREE.ShaderMaterial
}

// incadrarea "object-cover": ce parte din poza se vede, in functie de proportia hero-ului
function coverUv(canvasAspect: number) {
    if (canvasAspect > PHOTO_ASPECT) {
        // hero mai lat decat poza: taiem sus/jos, pastrand zona de la ~35% de sus
        const sy = PHOTO_ASPECT / canvasAspect
        return { scale: new THREE.Vector2(1, sy), offset: new THREE.Vector2(0, (1 - sy) * 0.65) }
    }
    // hero mai ingust: taiem din stanga, poza ramane lipita de dreapta (unde e tehnicianul)
    const sx = canvasAspect / PHOTO_ASPECT
    return { scale: new THREE.Vector2(sx, 1), offset: new THREE.Vector2(1 - sx, 0) }
}

function CleanPlane() {
    const { size, gl } = useThree()
    const photo = useLoader(THREE.TextureLoader, "/hero-bg.jpg")
    const reduceMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, [])
    const coarse = useMemo(() => window.matchMedia("(pointer: coarse)").matches, [])

    // valorile initiale trimise shader-ului; le modificam apoi prin materialRef
    const [uniforms] = useState(() => ({
        uPhoto: { value: photo },
        uDirty: { value: null as THREE.Texture | null },
        uMask: { value: null as THREE.Texture | null },
        uScale: { value: new THREE.Vector2(1, 1) },
        uOffset: { value: new THREE.Vector2(0, 0) },
        uWide: { value: 1 },
        // #0F2318 ca valori brute 0..1 (canvas-ul lucreaza fara conversii de culoare)
        uForest: { value: new THREE.Vector3(15 / 255, 35 / 255, 24 / 255) },
    }))

    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const maskRef = useRef<MaskData | null>(null)
    const bakeRef = useRef<BakeData | null>(null)
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

    // masca: un canvas 2D in care desenam cu alb pe unde trece mouse-ul; negru = murdar
    useEffect(() => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!
        const texture = new THREE.CanvasTexture(canvas)

        // pensula: un cerc alb cu margini moi, pregatit o singura data (desenarea cu blur la fiecare cadru era lenta)
        const brush = document.createElement("canvas")
        brush.width = brush.height = 64
        const bctx = brush.getContext("2d")!
        const gradient = bctx.createRadialGradient(32, 32, 0, 32, 32, 32)
        gradient.addColorStop(0, "rgba(255,255,255,1)")
        gradient.addColorStop(0.55, "rgba(255,255,255,0.9)")
        gradient.addColorStop(1, "rgba(255,255,255,0)")
        bctx.fillStyle = gradient
        bctx.fillRect(0, 0, 64, 64)

        maskRef.current = { canvas, ctx, texture, brush, frame: 0, lastWipe: 0, changed: true }
        if (materialRef.current) materialRef.current.uniforms.uMask.value = texture
        return () => texture.dispose()
    }, [])

    // "cuptorul" pentru murdarie: o scena separata care deseneaza shader-ul greu intr-o textura
    useEffect(() => {
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: bakeFragmentShader,
            uniforms: {
                uPhoto: { value: photo },
                uScale: { value: new THREE.Vector2(1, 1) },
                uOffset: { value: new THREE.Vector2(0, 0) },
                uAspect: { value: 1 },
            },
        })
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
        quad.frustumCulled = false
        const scene = new THREE.Scene()
        scene.add(quad)
        const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false })
        bakeRef.current = { target, scene, camera: new THREE.Camera(), material }
        if (materialRef.current) materialRef.current.uniforms.uDirty.value = target.texture
        return () => {
            target.dispose()
            material.dispose()
            quad.geometry.dispose()
        }
    }, [photo])

    // la redimensionare: incadram poza, refacem masca si "coacem" din nou murdaria la noua dimensiune
    useEffect(() => {
        const mask = maskRef.current
        const bake = bakeRef.current
        const material = materialRef.current
        if (!mask || !bake || !material) return

        const canvasAspect = size.width / size.height
        const { scale, offset } = coverUv(canvasAspect)

        // masca: pe telefon la rezolutie mai mica (e oricum estompata)
        const maskWidth = coarse ? 256 : 512
        mask.canvas.width = maskWidth
        mask.canvas.height = Math.max(1, Math.round((maskWidth * size.height) / size.width))
        mask.ctx.fillStyle = "black"
        mask.ctx.fillRect(0, 0, mask.canvas.width, mask.canvas.height)
        // canvas-ul si-a schimbat dimensiunea: textura trebuie realocata pe placa video, nu doar actualizata
        mask.texture.dispose()
        mask.texture.needsUpdate = true

        const u = material.uniforms
        u.uScale.value.copy(scale)
        u.uOffset.value.copy(offset)
        // acelasi prag ca "lg:" din Tailwind (1024px), unde si textul trece pe partea stanga
        u.uWide.value = window.innerWidth >= 1024 ? 1 : 0

        // coacem murdaria o singura data, la rezolutia reala a canvas-ului
        const b = bake.material.uniforms
        b.uScale.value.copy(scale)
        b.uOffset.value.copy(offset)
        b.uAspect.value = canvasAspect
        const dpr = gl.getPixelRatio()
        bake.target.setSize(Math.round(size.width * dpr), Math.round(size.height * dpr))
        gl.setRenderTarget(bake.target)
        gl.render(bake.scene, bake.camera)
        gl.setRenderTarget(null)
    }, [size, gl, coarse])

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
        if (!mask) return
        const { ctx, canvas, texture, brush: brushImage } = mask
        const t = state.clock.elapsedTime
        if (start.current === null) start.current = t

        // la incarcare, o "stergere" automata pe partea dreapta, ca vizitatorul sa vada efectul
        const intro = (t - start.current) / 1.8
        if (!reduceMotion && intro <= 1) {
            const x = size.width * (0.5 + 0.45 * intro)
            const y = size.height * (0.72 - 0.45 * intro + Math.sin(intro * Math.PI * 3) * 0.08)
            pending.current.push({ x, y })
        }

        // zonele curatate se "murdaresc" incet la loc. o facem o data la 3 cadre (cu pas triplu),
        // si deloc dupa ce masca a ajuns complet neagra, ca sa nu trimitem degeaba textura la placa video
        mask.frame++
        if (mask.frame % 3 === 0 && t - mask.lastWipe < IDLE_AFTER) {
            ctx.globalAlpha = 1
            ctx.fillStyle = `rgba(0, 0, 0, ${reduceMotion ? 0.012 : 0.024})`
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            mask.changed = true
        }

        // desenam traseul ca "stampile" din pensula pregatita, la distante mici una de alta
        const k = canvas.width / size.width
        const brush = Math.min(BRUSH_PX, size.width * 0.13)
        const stampSize = brush * 2.6 * k
        const sp = sparks.current
        for (const p of pending.current) {
            const from = last.current ?? p
            const dist = Math.hypot(p.x - from.x, p.y - from.y)
            const steps = Math.max(1, Math.ceil(dist / (brush * 0.35)))
            for (let s = 1; s <= steps; s++) {
                const x = (from.x + ((p.x - from.x) * s) / steps) * k
                const y = (from.y + ((p.y - from.y) * s) / steps) * k
                ctx.drawImage(brushImage, x - stampSize / 2, y - stampSize / 2, stampSize, stampSize)
            }
            mask.changed = true
            mask.lastWipe = t

            // pe masura ce buretele avanseaza, lasam in urma cate o scanteie
            if (sp && !reduceMotion) {
                sp.travelled += dist
                while (sp.travelled > SPARK_EVERY_PX) {
                    sp.travelled -= SPARK_EVERY_PX
                    const i = sp.next
                    sp.next = (sp.next + 1) % SPARKS
                    // pozitie aleatorie in zona sterse, transformata din pixeli in coordonate de ecran (-1..1)
                    const angle = Math.random() * Math.PI * 2
                    const r = Math.random() * brush * 0.9
                    const sx = p.x + Math.cos(angle) * r
                    const sy = p.y + Math.sin(angle) * r
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

        // trimitem masca la placa video doar cand s-a schimbat ceva
        if (mask.changed) {
            texture.needsUpdate = true
            mask.changed = false
        }

        // scanteile apar, clipesc si se sting
        if (sp) {
            const dt = Math.min(delta, 0.05)
            let active = false
            for (let i = 0; i < SPARKS; i++) {
                if (sp.life[i] >= 1) {
                    sp.alphas[i] = 0
                    continue
                }
                active = true
                sp.life[i] = Math.min(1, sp.life[i] + dt / sp.duration[i])
                const glow = Math.sin(sp.life[i] * Math.PI) // 0 -> 1 -> 0
                sp.alphas[i] = glow
                sp.sizes[i] = sp.baseSize[i] * (0.4 + 0.6 * glow)
            }
            if (active) {
                sp.geometry.attributes.position.needsUpdate = true
                sp.geometry.attributes.aAlpha.needsUpdate = true
                sp.geometry.attributes.aSize.needsUpdate = true
            }
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
