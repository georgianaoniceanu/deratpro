"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import * as THREE from "three"

// dimensiunile fotografiei din public/hero-bg.jpg (pentru incadrarea de tip "cover")
const PHOTO_ASPECT = 2400 / 2053
const BRUSH_PX = 70 // raza "buretelui" in pixeli de ecran
const IDLE_AFTER = 9 // secunde fara stergere dupa care masca e sigur complet murdara si ne oprim din desenat
const MAX_STAMPS = 1024 // cate "stampile" de burete desenam maxim intr-un cadru
const ROLLER_STAMP = 0.3 // stampilele trafaletului sunt mai mici decat buretele, ca marginea sa aiba textura rolei

// ---------- telefon: trafaletul care descopera poza ----------
const ROLLER_LEN = 170 // lungimea rolei in unitatile modelului; pe ecran o scalam la ~45% din latime
const ROLLER_RADIUS = 22
const ROLLER_WIDTH = 0.45 // lungimea rolei pe ecran, ca fractiune din latimea hero-ului
const STROKES_SECONDS = 9 // cat dureaza toate trecerile la un loc (impartite dupa lungime); mai mare = mai lent
const SHIFT_SECONDS = 0.6 // cat dureaza mutarea de la o trecere la urmatoarea

type RollerPath = {
    points: { x: number; y: number; d: number }[] // d = cate secunde dureaza drumul pana la punctul respectiv
    total: number
    tilt: number // unghiul rolei (perpendiculara pe directia de mers)
    dx: number // directia de mers, pe ecran
    dy: number
}

// traseul trafaletului, ca mana unui zugrav, dar pe diagonala: prima trecere porneste din coltul din stanga-sus
// si merge spre dreapta-jos, apoi treceri paralele, dus-intors, cate una langa alta, pana acopera tot hero-ul
function buildRollerPath(w: number, h: number): RollerPath {
    const len = Math.hypot(w, h)
    const dx = w / len // directia diagonalei (stanga-sus -> dreapta-jos)
    const dy = h / len
    const px = -dy // perpendiculara pe ea
    const py = dx
    const roller = w * ROLLER_WIDTH
    const margin = roller * 0.6 // trafaletul intra si iese complet din cadru
    const halfAcross = (w / 2) * Math.abs(px) + (h / 2) * Math.abs(py)
    const gap = roller * 0.85 // trecerile se suprapun putin
    const side = Math.ceil((halfAcross - roller / 2) / gap)

    // ordinea trecerilor: diagonala din colt, apoi spre o parte, apoi spre cealalta
    const offsets = [0]
    for (let i = 1; i <= side; i++) offsets.push(i * gap)
    for (let i = 1; i <= side; i++) offsets.push(-i * gap)

    // pe fiecare trecere, doar bucata care atinge poza (plus marginea), ca sa nu piarda timp in afara ei
    const range = (u: number) => {
        const cx = w / 2 + px * u
        const cy = h / 2 + py * u
        const ax = [(-margin - cx) / dx, (w + margin - cx) / dx]
        const ay = [(-margin - cy) / dy, (h + margin - cy) / dy]
        return [Math.max(Math.min(...ax), Math.min(...ay)), Math.min(Math.max(...ax), Math.max(...ay))]
    }
    const at = (u: number, a: number) => ({ x: w / 2 + px * u + dx * a, y: h / 2 + py * u + dy * a })

    // timpul total al trecerilor e fix (si pe telefon, si pe tableta), impartit dupa lungimea fiecarei treceri
    const ranges = offsets.map(range)
    const totalLength = ranges.reduce((sum, [a0, a1]) => sum + (a1 - a0), 0)

    const points: RollerPath["points"] = []
    offsets.forEach((u, i) => {
        const [a0, a1] = ranges[i]
        // trecerile alterneaza: una in jos, una in sus
        const [from, to] = i % 2 === 0 ? [a0, a1] : [a1, a0]
        points.push({ ...at(u, from), d: i === 0 ? 0 : SHIFT_SECONDS })
        points.push({ ...at(u, to), d: ((a1 - a0) / totalLength) * STROKES_SECONDS })
    })
    // la final iese complet din cadru, cu tot cu maner
    const last = points[points.length - 1]
    const exitDir = offsets.length % 2 === 1 ? 1 : -1
    points.push({ x: last.x + dx * exitDir * roller, y: last.y + dy * exitDir * roller, d: 0.8 })

    // unghiul rolei: perpendiculara pe directia de mers, cu manerul in jos
    let tilt = Math.atan2(-dy, dx) - Math.PI / 2
    while (tilt <= -Math.PI / 2) tilt += Math.PI
    while (tilt > Math.PI / 2) tilt -= Math.PI

    return { points, total: points.reduce((sum, p) => sum + p.d, 0), tilt, dx, dy }
}

// pozitia trafaletului (in pixeli) la momentul `time`, cu pornire si oprire lina pe fiecare bucata de drum
function rollerAt(path: RollerPath, time: number) {
    const { points } = path
    let t = Math.max(0, time)
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]
        const b = points[i]
        if (t <= b.d) {
            const k = b.d > 0 ? t / b.d : 1
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
            return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e }
        }
        t -= b.d
    }
    return { x: points[points.length - 1].x, y: points[points.length - 1].y }
}

// o bara (cilindru) intre doua puncte, pentru cadrul metalic si maner
function Bar({ from, to, radius, color }: { from: [number, number, number]; to: [number, number, number]; radius: number; color: string }) {
    const { position, quaternion, length } = useMemo(() => {
        const a = new THREE.Vector3(...from)
        const b = new THREE.Vector3(...to)
        const dir = b.clone().sub(a)
        return {
            position: a.clone().add(b).multiplyScalar(0.5),
            quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
            length: dir.length(),
        }
    }, [from, to])
    return (
        <mesh position={position} quaternion={quaternion}>
            <cylinderGeometry args={[radius, radius, length, 12]} />
            <meshLambertMaterial color={color} />
        </mesh>
    )
}

// punctele cadrului, definite o singura data (ca Bar sa nu recalculeze la fiecare randare)
const FRAME_A: [number, number, number] = [ROLLER_LEN / 2, 0, 0]
const FRAME_B: [number, number, number] = [ROLLER_LEN / 2 + 14, 0, 0]
const FRAME_C: [number, number, number] = [ROLLER_LEN / 2 + 14, -36, 0]
const FRAME_D: [number, number, number] = [0, -78, 0]
const HANDLE_END: [number, number, number] = [0, -165, 0]

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
// sa calculam petele si praful pentru fiecare pixel la fiecare cadru era prea greu pentru telefoane
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
  uniform float uCover; // 1 = telefon: in loc de poza murdara, un strat verde plin pe care il "da jos" trafaletul
  ${shaderCommon}

  void main() {
    vec3 clean = samplePhoto() * 1.08; // culorile reale, putin mai luminoase
    vec3 dirty = mix(texture2D(uDirty, vUv).rgb, uForest, uCover);

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

// 3) masca, desenata direct pe placa video (nu intr-un canvas 2D copiat la fiecare cadru, care era lent pe telefon):
//    - "stampile" de burete: puncte rotunde, albe, cu margini moi
//    - "murdarirea" la loc: un dreptunghi negru, aproape transparent, desenat peste masca
//    position.z = 0: stampila normala (burete); position.z > 0: stampila mica de trafalet, cu taria z
//    (o taria mica curata doar putin, asa raman "urmele" trafaletului)
const stampVertexShader = `
  uniform float uSize;
  uniform float uSmall;
  varying float vStrength;
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    float small = step(0.0001, position.z);
    gl_PointSize = uSize * mix(1.0, uSmall, small);
    vStrength = mix(0.9, position.z, small);
  }
`
const stampFragmentShader = `
  varying float vStrength;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(1.0, 1.0, 1.0, smoothstep(0.5, 0.15, d) * vStrength);
  }
`
const fadeFragmentShader = `
  uniform float uFade;
  void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, uFade); }
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
    target: THREE.WebGLRenderTarget
    scale: number // cati pixeli de masca la un pixel de ecran
    fadeScene: THREE.Scene
    fadeMaterial: THREE.ShaderMaterial
    stampScene: THREE.Scene
    stampGeometry: THREE.BufferGeometry
    stampPositions: Float32Array
    stampMaterial: THREE.ShaderMaterial
    camera: THREE.Camera
    frame: number
    lastWipe: number // cand s-a sters ultima data (secunde)
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

function fullscreenQuad(material: THREE.ShaderMaterial) {
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    quad.frustumCulled = false
    return quad
}

function CleanPlane() {
    const { size, gl, invalidate } = useThree()
    const photo = useLoader(THREE.TextureLoader, "/hero-bg.jpg")
    const reduceMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, [])
    const coarse = useMemo(() => window.matchMedia("(pointer: coarse)").matches, [])
    // telefon (fara "reduce motion"): hero-ul porneste verde si trafaletul descopera poza, o singura data
    const cover = coarse && !reduceMotion
    const rollerPath = useMemo(() => buildRollerPath(size.width, size.height), [size.width, size.height])

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
        uCover: { value: cover ? 1 : 0 },
    }))

    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const maskRef = useRef<MaskData | null>(null)
    const bakeRef = useRef<BakeData | null>(null)
    const pending = useRef<{ x: number; y: number }[]>([]) // puncte noi, in pixeli de ecran relativi la canvas
    const last = useRef<{ x: number; y: number } | null>(null)
    const start = useRef<number | null>(null)
    const sweeping = useRef(false) // daca in cadrul anterior rula o stergere automata
    const rollerPrev = useRef<{ x: number; y: number; tilt: number } | null>(null) // pozitia trafaletului in cadrul anterior
    const revealDone = useRef(false) // pe telefon: trafaletul a terminat, poza ramane curata
    const tool = useRef<THREE.Group>(null)
    const rollerMesh = useRef<THREE.Mesh>(null)
    // textura rolei: fire fine, putin diferite ca nuanta, ca sa se vada cum se invarte
    const [napTexture] = useState(() => {
        const canvas = document.createElement("canvas")
        canvas.width = 8
        canvas.height = 64
        const ctx = canvas.getContext("2d")!
        for (let y = 0; y < 64; y++) {
            const shade = 215 + Math.floor(Math.random() * 40)
            ctx.fillStyle = `rgb(${shade}, ${shade - 8}, ${shade - 22})`
            ctx.fillRect(0, y, 8, 1)
        }
        const texture = new THREE.CanvasTexture(canvas)
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping
        return texture
    })
    useEffect(() => () => napTexture.dispose(), [napTexture])
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

    // masca pe placa video: o textura in care desenam direct stampilele de burete si "murdarirea"
    useEffect(() => {
        const camera = new THREE.Camera()
        const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false })

        const fadeMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: fadeFragmentShader,
            uniforms: { uFade: { value: 0 } },
            transparent: true,
            depthTest: false,
            depthWrite: false,
        })
        const fadeScene = new THREE.Scene()
        fadeScene.add(fullscreenQuad(fadeMaterial))

        const stampPositions = new Float32Array(MAX_STAMPS * 3)
        const stampGeometry = new THREE.BufferGeometry()
        stampGeometry.setAttribute("position", new THREE.BufferAttribute(stampPositions, 3))
        const stampMaterial = new THREE.ShaderMaterial({
            vertexShader: stampVertexShader,
            fragmentShader: stampFragmentShader,
            uniforms: { uSize: { value: 1 }, uSmall: { value: ROLLER_STAMP } },
            transparent: true,
            depthTest: false,
            depthWrite: false,
        })
        const stampPoints = new THREE.Points(stampGeometry, stampMaterial)
        stampPoints.frustumCulled = false
        const stampScene = new THREE.Scene()
        stampScene.add(stampPoints)

        maskRef.current = {
            target,
            // pe telefon, masca are rezolutie mai mica (e oricum estompata)
            scale: coarse ? 0.35 : 0.5,
            fadeScene,
            fadeMaterial,
            stampScene,
            stampGeometry,
            stampPositions,
            stampMaterial,
            camera,
            frame: 0,
            lastWipe: -IDLE_AFTER,
        }
        if (materialRef.current) materialRef.current.uniforms.uMask.value = target.texture
        return () => {
            target.dispose()
            fadeMaterial.dispose()
            stampMaterial.dispose()
            stampGeometry.dispose()
        }
    }, [coarse])

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
        const quad = fullscreenQuad(material)
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

    // la redimensionare: incadram poza, golim masca si "coacem" din nou murdaria la noua dimensiune
    useEffect(() => {
        const mask = maskRef.current
        const bake = bakeRef.current
        const material = materialRef.current
        if (!mask || !bake || !material) return

        const canvasAspect = size.width / size.height
        const { scale, offset } = coverUv(canvasAspect)

        const u = material.uniforms
        u.uScale.value.copy(scale)
        u.uOffset.value.copy(offset)
        // acelasi prag ca "lg:" din Tailwind (1024px), unde si textul trece pe partea stanga
        u.uWide.value = window.innerWidth >= 1024 ? 1 : 0

        const previousClear = gl.getClearColor(new THREE.Color())
        const previousAlpha = gl.getClearAlpha()

        // masca noua, complet neagra (= totul murdar); pe telefon, daca trafaletul a terminat deja, alba (= curat)
        mask.target.setSize(Math.max(1, Math.round(size.width * mask.scale)), Math.max(1, Math.round(size.height * mask.scale)))
        gl.setRenderTarget(mask.target)
        gl.setClearColor(revealDone.current ? 0xffffff : 0x000000, 1)
        gl.clear()

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
        gl.setClearColor(previousClear, previousAlpha)
        invalidate()
    }, [size, gl, invalidate])

    // mouse / deget: canvas-ul e sub text, asa ca ascultam pe window si verificam daca e peste hero
    useEffect(() => {
        // pozitia canvas-ului in pagina, calculata o singura data (si la redimensionare).
        // s-o cerem la fiecare miscare a degetului (getBoundingClientRect) obliga telefonul sa recalculeze
        // layout-ul paginii in timpul derularii, ceea ce producea lag
        let box = { left: 0, top: 0, width: 0, height: 0 }
        const measure = () => {
            const r = gl.domElement.getBoundingClientRect()
            box = { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height }
        }
        measure()
        // la montare canvas-ul poate avea inca dimensiunea 0; il masuram din nou cand isi primeste dimensiunea reala
        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(gl.domElement)

        function addPoint(clientX: number, clientY: number) {
            if (box.width === 0) measure() // siguranta, daca masurarea initiala a iesit goala
            // coordonate in pagina = coordonate pe ecran + cat s-a derulat (citirea scroll-ului nu recalculeaza layout-ul)
            const x = clientX + window.scrollX - box.left
            const y = clientY + window.scrollY - box.top
            if (x < 0 || y < 0 || x > box.width || y > box.height) {
                last.current = null
                return
            }
            pending.current.push({ x, y })
            invalidate() // desenam doar cand chiar se intampla ceva
        }
        const onPointer = (e: PointerEvent) => {
            if (e.pointerType === "mouse" || e.pointerType === "pen") addPoint(e.clientX, e.clientY)
        }
        // pe telefoane nu stergem cu degetul: glisatul se confunda cu derularea paginii si era greu de folosit.
        // acolo stergerea e automata (vezi useFrame)

        window.addEventListener("resize", measure)
        window.addEventListener("load", measure)
        window.addEventListener("pointermove", onPointer)
        window.addEventListener("pointerdown", onPointer)
        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("resize", measure)
            window.removeEventListener("load", measure)
            window.removeEventListener("pointermove", onPointer)
            window.removeEventListener("pointerdown", onPointer)
        }
    }, [gl, invalidate, size])

    useFrame((state, delta) => {
        const mask = maskRef.current
        if (!mask) return
        const t = state.clock.elapsedTime
        if (start.current === null) start.current = t

        // stampilele de burete pentru cadrul curent (in coordonate de ecran -1..1)
        const brush = Math.min(BRUSH_PX, size.width * 0.13)
        let stamps = 0
        const addStamp = (x: number, y: number, strength = 0) => {
            if (stamps >= MAX_STAMPS) return
            mask.stampPositions[stamps * 3] = (x / size.width) * 2 - 1
            mask.stampPositions[stamps * 3 + 1] = 1 - (y / size.height) * 2
            mask.stampPositions[stamps * 3 + 2] = strength
            stamps++
        }

        // stergerea automata
        const elapsed = t - start.current
        let introRunning = false
        if (cover) {
            // telefon: trafaletul 3D trece de cateva ori peste stratul verde si descopera poza, o singura data
            const w = size.width
            const h = size.height
            const rollerTime = elapsed - 0.3 // o mica pauza inainte sa intre in cadru
            const done = rollerTime > rollerPath.total
            if (!done && !revealDone.current) {
                introRunning = true
                const pos = rollerAt(rollerPath, rollerTime)
                // rola sta perpendicular pe diagonala, cu o mica oscilatie, ca tinuta de mana
                const tilt = rollerPath.tilt + Math.sin(rollerTime * 1.7) * 0.05
                const prev = rollerPrev.current ?? { ...pos, tilt }
                const vx = pos.x - prev.x
                const vy = pos.y - prev.y

                const scale = (w * ROLLER_WIDTH) / ROLLER_LEN
                const half = (ROLLER_LEN / 2) * scale
                const dot = brush * 2.6 * ROLLER_STAMP // diametrul unei stampile de trafalet
                const spacing = dot * 0.25

                // o "linie" de stampile pe lungimea rolei; taria variaza putin la fiecare stampila,
                // asa marginea zonei curatate are textura rolei, nu e o linie perfect neteda
                const rollAt = (x: number, y: number, a: number) => {
                    const cx = Math.cos(a)
                    const cy = -Math.sin(a) // pe ecran, y creste in jos
                    for (let r = -half; r <= half; r += spacing) addStamp(x + cx * r, y + cy * r, 0.3 + Math.random() * 0.6)
                }
                // umplem tot drumul de la cadrul trecut, ca sa nu ramana goluri
                const dist = Math.hypot(vx, vy)
                // daca telefonul a sarit cadre si drumul e lung, rarim liniile ca sa nu depasim limita de stampile
                const perRow = Math.ceil((2 * half) / spacing) + 1
                const steps = Math.max(1, Math.min(Math.ceil(dist / spacing), Math.floor(MAX_STAMPS / perRow)))
                for (let s = 1; s <= steps; s++) {
                    const k = s / steps
                    rollAt(prev.x + vx * k, prev.y + vy * k, prev.tilt + (tilt - prev.tilt) * k)
                }
                rollerPrev.current = { ...pos, tilt }
                mask.lastWipe = t

                // modelul 3D: il mutam in pozitia rolei si invartim rola cat a parcurs
                if (tool.current) {
                    tool.current.visible = true
                    tool.current.position.set(pos.x - w / 2, h / 2 - pos.y, 0)
                    tool.current.rotation.z = tilt
                    tool.current.scale.setScalar(scale)
                }
                if (rollerMesh.current) {
                    const rolled = vx * rollerPath.dx + vy * rollerPath.dy // cat a inaintat pe directia trecerii
                    rollerMesh.current.rotation.x += rolled / (ROLLER_RADIUS * scale)
                }
            } else if (!revealDone.current) {
                // gata: ascundem trafaletul si ne asiguram ca poza e complet curata
                revealDone.current = true
                if (tool.current) tool.current.visible = false
                const renderer = state.gl
                renderer.setRenderTarget(mask.target)
                const previousClear = renderer.getClearColor(new THREE.Color())
                const previousAlpha = renderer.getClearAlpha()
                renderer.setClearColor(0xffffff, 1)
                renderer.clear()
                renderer.setClearColor(previousClear, previousAlpha)
                renderer.setRenderTarget(null)
            }
        } else if (!reduceMotion && !coarse) {
            // calculator: o singura stergere la incarcare, pe partea dreapta, ca vizitatorul sa vada efectul
            const progress = elapsed / 1.8
            if (progress <= 1) {
                introRunning = true
                if (!sweeping.current) last.current = null // nu legam stergerea de o pozitie veche a mouse-ului
                const x = size.width * (0.5 + 0.45 * progress)
                const y = size.height * (0.72 - 0.45 * progress + Math.sin(progress * Math.PI * 3) * 0.08)
                pending.current.push({ x, y })
            }
        }
        sweeping.current = introRunning

        // traseul mouse-ului: stampile dese intre punctul anterior si cel nou
        const sp = sparks.current
        for (const p of pending.current) {
            const from = last.current ?? p
            const dist = Math.hypot(p.x - from.x, p.y - from.y)
            const steps = Math.max(1, Math.ceil(dist / (brush * 0.35)))
            for (let s = 1; s <= steps; s++) {
                addStamp(from.x + ((p.x - from.x) * s) / steps, from.y + ((p.y - from.y) * s) / steps)
            }
            mask.lastWipe = t

            // pe masura ce buretele avanseaza, lasam in urma cate o scanteie
            // (pe telefoane, fara scantei: mai putin de desenat)
            if (sp && !reduceMotion && !coarse) {
                sp.travelled += dist
                while (sp.travelled > SPARK_EVERY_PX) {
                    sp.travelled -= SPARK_EVERY_PX
                    const i = sp.next
                    sp.next = (sp.next + 1) % SPARKS
                    const angle = Math.random() * Math.PI * 2
                    const r = Math.random() * brush * 0.9
                    sp.positions[i * 3] = ((p.x + Math.cos(angle) * r) / size.width) * 2 - 1
                    sp.positions[i * 3 + 1] = 1 - ((p.y + Math.sin(angle) * r) / size.height) * 2
                    sp.life[i] = 0
                    sp.duration[i] = 0.6 + Math.random() * 0.6
                    sp.baseSize[i] = 14 + Math.random() * 18
                }
            }
            last.current = p
        }
        pending.current = []

        // actualizam masca direct pe placa video: intai "murdarim" putin (o data la 3 cadre), apoi desenam stampilele
        mask.frame++
        // pe telefon, poza descoperita ramane curata (murdaria nu mai revine)
        const wiping = !cover && t - mask.lastWipe < IDLE_AFTER
        const fadeNow = wiping && mask.frame % 3 === 0
        if (fadeNow || stamps > 0) {
            const renderer = state.gl
            const autoClear = renderer.autoClear
            renderer.autoClear = false // desenam peste masca existenta, nu o stergem
            renderer.setRenderTarget(mask.target)
            if (fadeNow) {
                mask.fadeMaterial.uniforms.uFade.value = reduceMotion ? 0.012 : 0.024
                renderer.render(mask.fadeScene, mask.camera)
            }
            if (stamps > 0) {
                mask.stampGeometry.attributes.position.needsUpdate = true
                mask.stampGeometry.setDrawRange(0, stamps)
                mask.stampMaterial.uniforms.uSize.value = brush * 2.6 * mask.scale
                renderer.render(mask.stampScene, mask.camera)
            }
            renderer.setRenderTarget(null)
            renderer.autoClear = autoClear
        }

        // scanteile apar, clipesc si se sting
        let sparksActive = false
        if (sp) {
            const dt = Math.min(delta, 0.05)
            for (let i = 0; i < SPARKS; i++) {
                if (sp.life[i] >= 1) {
                    sp.alphas[i] = 0
                    continue
                }
                sparksActive = true
                sp.life[i] = Math.min(1, sp.life[i] + dt / sp.duration[i])
                const glow = Math.sin(sp.life[i] * Math.PI) // 0 -> 1 -> 0
                sp.alphas[i] = glow
                sp.sizes[i] = sp.baseSize[i] * (0.4 + 0.6 * glow)
            }
            sp.geometry.attributes.position.needsUpdate = true
            sp.geometry.attributes.aAlpha.needsUpdate = true
            sp.geometry.attributes.aSize.needsUpdate = true
        }

        // canvas-ul deseneaza doar la cerere: continuam cat timp inca se misca ceva, apoi ne oprim complet
        // pe telefon, ~30 de cadre pe secunda in loc de 60 (suficient pentru o stergere lenta, cu jumatate din efort)
        if (introRunning || wiping || sparksActive) {
            if (coarse) setTimeout(() => state.invalidate(), 33)
            else state.invalidate()
        }
    })

    return (
        <>
            <mesh frustumCulled={false}>
                <planeGeometry args={[2, 2]} />
                <shaderMaterial ref={materialRef} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
            </mesh>

            {/* scanteile se desenează peste poza; geometria e atasata din useEffect */}
            <points ref={sparkPoints} frustumCulled={false} renderOrder={1} visible={!coarse}>
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

            {/* telefon: trafaletul 3D (rola crem, cadru metalic, maner mustar), construit din cilindri simpli,
                fara model descarcat. e inclinat spre privitor, ca manerul sa vina "din ecran" */}
            {cover && (
                <group ref={tool} visible={false} renderOrder={2}>
                    <ambientLight intensity={1.6} />
                    <directionalLight position={[-200, 300, 400]} intensity={2.2} />
                    <group rotation-x={-0.6}>
                        <mesh ref={rollerMesh} rotation-z={Math.PI / 2}>
                            <cylinderGeometry args={[ROLLER_RADIUS, ROLLER_RADIUS, ROLLER_LEN, 28]} />
                            <meshLambertMaterial map={napTexture} />
                        </mesh>
                        <Bar from={FRAME_A} to={FRAME_B} radius={3} color="#c9ccc9" />
                        <Bar from={FRAME_B} to={FRAME_C} radius={3} color="#c9ccc9" />
                        <Bar from={FRAME_C} to={FRAME_D} radius={3} color="#c9ccc9" />
                        <Bar from={FRAME_D} to={HANDLE_END} radius={9} color="#E5A93C" />
                    </group>
                </group>
            )}
        </>
    )
}

export default function HeroCleanScene() {
    const wrapper = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(true)
    // pe telefoane (ecran tactil) desenam la rezolutie mai mica: diferenta nu se vede, dar consuma mult mai putin
    const [maxDpr] = useState(() => (window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5))

    // cand hero-ul iese de pe ecran, oprim complet desenarea
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
                // camera ortografica, 1 unitate = 1 pixel: trafaletul se pozitioneaza direct in pixeli
                orthographic
                camera={{ position: [0, 0, 500], near: 1, far: 2000, zoom: 1 }}
                dpr={[1, maxDpr]}
                // "demand": deseneaza doar cand se schimba ceva (stergere, scantei), nu de 60 de ori pe secunda
                frameloop={visible ? "demand" : "never"}
                gl={{ antialias: false }}
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
                <CleanPlane />
            </Canvas>
        </div>
    )
}
