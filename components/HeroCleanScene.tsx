"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import * as THREE from "three"

// dimensiunile fotografiei din public/hero-bg.jpg (pentru incadrarea de tip "cover")
const PHOTO_ASPECT = 2400 / 2053
const BRUSH_PX = 70 // raza "buretelui" in pixeli de ecran
const IDLE_AFTER = 9 // secunde fara stergere dupa care masca e sigur complet murdara si ne oprim din desenat
const MAX_STAMPS = 1024 // cate "stampile" de burete desenam maxim intr-un cadru
const FOG_STAMP = 1.1 // stampilele cetii: putin mai mari decat buretele, foarte moi si slabe

// ---------- telefon: nebulizatorul care descopera poza ----------
// hero-ul porneste verde; din coltul din stanga-sus intra lancea unui nebulizator si pulverizeaza ceata
// pe diagonala. unde se aseaza ceata, verdele se dizolva treptat si apare poza
const FOG_DELAY = 0.3 // pauza pana intra lancea in cadru
const FOG_ENTER = 0.5 // cat dureaza intrarea lancei
const FOG_SPRAY = 4.6 // cat pulverizeaza
const FOG_FINISH = 1.2 // la final: lancea iese, iar ce a mai ramas verde se dizolva lin (in total ~6.6 secunde)
const FOG_PARTICLES = 220 // cate particule de ceata pot exista in acelasi timp (le refolosim prin rotatie)
const FOG_RATE = 110 // particule noi pe secunda
const FOG_LIFE = 1.5 // cat traieste o particula (secunde)
const FOG_DRAG = 2.4 // cat de repede incetineste ceata dupa ce iese din duza

// particulele de ceata: pete rotunde, foarte moi, albe-verzui, care cresc si se sting
const fogVertexShader = `
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
const fogFragmentShader = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(0.88, 0.96, 0.92, a * a * vAlpha);
  }
`

type FogData = {
    geometry: THREE.BufferGeometry
    positions: Float32Array // pentru desenare, in coordonate de ecran -1..1
    alphas: Float32Array
    sizes: Float32Array
    x: Float32Array // pozitia si viteza, in pixeli
    y: Float32Array
    vx: Float32Array
    vy: Float32Array
    life: Float32Array // 0..1 = cat a trait; >= 1 = stinsa
    next: number
    carry: number // fractiunea de particula ramasa de emis din cadrul trecut
}

// o bara (cilindru) intre doua puncte, pentru lancea nebulizatorului
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

// lancea, in unitatile modelului: duza e in origine si pulverizeaza spre +x, restul lancei merge inapoi, spre -x
// (definite o singura data, ca Bar sa nu recalculeze la fiecare randare)
const COLLAR_FRONT: [number, number, number] = [-12, 0, 0]
const COLLAR_BACK: [number, number, number] = [-28, 0, 0]
const WAND_BACK: [number, number, number] = [-340, 0, 0]
const GRIP_FRONT: [number, number, number] = [-170, 0, 0]
const GRIP_BACK: [number, number, number] = [-260, 0, 0]

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
  uniform float uCover; // 1 = telefon: in loc de poza murdara, un strat verde plin pe care il dizolva ceata
  ${shaderCommon}

  void main() {
    vec3 clean = samplePhoto() * 1.08; // culorile reale, putin mai luminoase
    vec3 dirty = mix(texture2D(uDirty, vUv).rgb, uForest, uCover);

    float raw = texture2D(uMask, vUv).r;
    // pe telefon, marginea zonei descoperite e neregulata, ca un nor de ceata (zgomotul conteaza doar pe margine,
    // nu unde e complet verde sau complet curat)
    raw += (noise(vUv * vec2(6.0, 11.0)) - 0.5) * 0.9 * raw * (1.0 - raw) * uCover;
    float m = smoothstep(0.05, 0.6, raw);
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
//    position.z = 0: stampila normala (burete); position.z > 0: stampila de ceata, cu taria z
//    (fiecare curata foarte putin; ceata dizolva verdele treptat, pe masura ce se aduna)
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
// uFill = 0: "murdareste" la loc (negru); uFill = 1: curata tot, lin (alb), la finalul cetii de pe telefon
const fadeFragmentShader = `
  uniform float uFade;
  uniform float uFill;
  void main() { gl_FragColor = vec4(vec3(uFill), uFade); }
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
    // telefon (fara "reduce motion"): hero-ul porneste verde si ceata nebulizatorului descopera poza, o singura data
    const cover = coarse && !reduceMotion

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
    const revealDone = useRef(false) // pe telefon: ceata a terminat, poza ramane curata
    const tool = useRef<THREE.Group>(null) // lancea nebulizatorului
    const fogPoints = useRef<THREE.Points>(null)
    const fog = useRef<FogData | null>(null)
    const [fogUniforms] = useState(() => ({ uPixelRatio: { value: 1 } }))

    // particulele de ceata (doar pe telefon): geometria o cream o singura data, apoi doar ii schimbam valorile
    useEffect(() => {
        if (!cover) return
        const positions = new Float32Array(FOG_PARTICLES * 3)
        const alphas = new Float32Array(FOG_PARTICLES)
        const sizes = new Float32Array(FOG_PARTICLES)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1))
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
        fog.current = {
            geometry,
            positions,
            alphas,
            sizes,
            x: new Float32Array(FOG_PARTICLES),
            y: new Float32Array(FOG_PARTICLES),
            vx: new Float32Array(FOG_PARTICLES),
            vy: new Float32Array(FOG_PARTICLES),
            life: new Float32Array(FOG_PARTICLES).fill(1),
            next: 0,
            carry: 0,
        }
        if (fogPoints.current) {
            fogPoints.current.geometry = geometry
            ;(fogPoints.current.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = gl.getPixelRatio()
        }
        return () => geometry.dispose()
    }, [cover, gl])
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
            uniforms: { uFade: { value: 0 }, uFill: { value: 0 } },
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
            uniforms: { uSize: { value: 1 }, uSmall: { value: FOG_STAMP } },
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

        // masca noua, complet neagra (= totul murdar); pe telefon, daca ceata a terminat deja, alba (= curat)
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
        if (cover && !revealDone.current) {
            // telefon: lancea nebulizatorului intra din coltul din stanga-sus si pulverizeaza ceata pe diagonala;
            // unde se aseaza ceata, verdele se dizolva si apare poza. o singura data
            const w = size.width
            const h = size.height
            const dt = Math.min(delta, 0.05)
            const ft = elapsed - FOG_DELAY
            const sprayStart = FOG_ENTER
            const sprayEnd = FOG_ENTER + FOG_SPRAY
            const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)
            introRunning = true
            mask.lastWipe = t

            // pozitia duzei: intra din colt, sta acolo cat pulverizeaza, apoi iese inapoi
            const rest = { x: w * 0.1, y: h * 0.06 }
            const out = { x: -50, y: -50 }
            const enter = ease(Math.min(1, Math.max(0, ft / FOG_ENTER)))
            const leave = ease(Math.min(1, Math.max(0, (ft - sprayEnd) / 0.6)))
            const k = enter * (1 - leave)
            const tipX = out.x + (rest.x - out.x) * k
            const tipY = out.y + (rest.y - out.y) * k

            // directia jetului: pe diagonala, cu o miscare lenta stanga-dreapta, ca mana operatorului,
            // ca ceata sa ajunga si spre coltul din dreapta-sus, si spre cel din stanga-jos
            const aim = Math.PI / 4 + Math.sin(Math.max(0, ft - sprayStart) * 2.4) * 0.62
            const scale = Math.min(1.6, Math.max(0.9, w / 400))

            const f = fog.current
            if (f) {
                // particule noi, doar cat pulverizeaza; ajung tot mai departe, ca ceata sa inainteze pe diagonala
                if (ft >= sprayStart && ft <= sprayEnd) {
                    const progress = (ft - sprayStart) / FOG_SPRAY
                    const reach = Math.hypot(w, h) * (0.3 + 0.85 * ease(Math.min(1, progress * 1.15)))
                    f.carry += FOG_RATE * dt
                    while (f.carry >= 1) {
                        f.carry -= 1
                        const i = f.next
                        f.next = (f.next + 1) % FOG_PARTICLES
                        const angle = aim + (Math.random() - 0.5) * 0.6
                        const dist = reach * (0.2 + 0.8 * Math.random())
                        f.x[i] = tipX + Math.cos(aim) * 8
                        f.y[i] = tipY + Math.sin(aim) * 8
                        // cu franare exponentiala, particula parcurge in total cam viteza / FOG_DRAG
                        f.vx[i] = Math.cos(angle) * dist * FOG_DRAG
                        f.vy[i] = Math.sin(angle) * dist * FOG_DRAG
                        f.life[i] = 0
                    }
                }

                // miscam particulele: incetinesc, cresc si se sting; fiecare dizolva putin verdele de sub ea
                const drag = Math.exp(-FOG_DRAG * dt)
                for (let i = 0; i < FOG_PARTICLES; i++) {
                    if (f.life[i] >= 1) {
                        f.alphas[i] = 0
                        continue
                    }
                    f.life[i] = Math.min(1, f.life[i] + dt / FOG_LIFE)
                    f.vx[i] *= drag
                    f.vy[i] *= drag
                    f.x[i] += f.vx[i] * dt
                    f.y[i] += f.vy[i] * dt
                    const life = f.life[i]
                    f.positions[i * 3] = (f.x[i] / w) * 2 - 1
                    f.positions[i * 3 + 1] = 1 - (f.y[i] / h) * 2
                    f.alphas[i] = Math.min(1, life * 6) * (1 - life) * 0.3
                    f.sizes[i] = (16 + 120 * Math.sqrt(life)) * scale
                    addStamp(f.x[i], f.y[i], 0.04 * (1 - life))
                }
                f.geometry.attributes.position.needsUpdate = true
                f.geometry.attributes.aAlpha.needsUpdate = true
                f.geometry.attributes.aSize.needsUpdate = true
            }

            // lancea: o asezam in pozitia duzei, orientata pe directia jetului
            if (tool.current) {
                tool.current.visible = ft > 0 && leave < 1
                tool.current.position.set(tipX - w / 2, h / 2 - tipY, 0)
                tool.current.rotation.z = -aim // in three.js y creste in sus, pe ecran in jos
                tool.current.scale.setScalar(scale)
            }

            const renderer = state.gl
            if (ft > sprayEnd && ft <= sprayEnd + FOG_FINISH) {
                // la final, ce a mai ramas verde se dizolva lin (desenam peste masca alb, tot mai tare)
                const fin = (ft - sprayEnd) / FOG_FINISH
                const autoClear = renderer.autoClear
                renderer.autoClear = false
                renderer.setRenderTarget(mask.target)
                mask.fadeMaterial.uniforms.uFill.value = 1
                mask.fadeMaterial.uniforms.uFade.value = 0.02 + 0.12 * fin
                renderer.render(mask.fadeScene, mask.camera)
                mask.fadeMaterial.uniforms.uFill.value = 0
                renderer.setRenderTarget(null)
                renderer.autoClear = autoClear
            } else if (ft > sprayEnd + FOG_FINISH) {
                // gata: ascundem tot si ne asiguram ca poza e complet curata
                revealDone.current = true
                introRunning = false
                if (tool.current) tool.current.visible = false
                if (fogPoints.current) fogPoints.current.visible = false
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

            {/* telefon: ceata nebulizatorului (particule moi, desenate peste poza) */}
            {cover && (
                <points ref={fogPoints} frustumCulled={false} renderOrder={1}>
                    <shaderMaterial
                        vertexShader={fogVertexShader}
                        fragmentShader={fogFragmentShader}
                        uniforms={fogUniforms}
                        transparent
                        depthWrite={false}
                        depthTest={false}
                    />
                </points>
            )}

            {/* telefon: lancea nebulizatorului (duza de alama, teava metalica, maner mustar), construita din
                forme simple, fara model descarcat. putin rotita, ca lumina sa-i dea volum */}
            {cover && (
                <group ref={tool} visible={false} renderOrder={2}>
                    <ambientLight intensity={1.6} />
                    <directionalLight position={[-200, 300, 400]} intensity={2.2} />
                    <group rotation-x={0.5} rotation-y={0.35}>
                        <mesh position={[-6, 0, 0]} rotation-z={-Math.PI / 2}>
                            <coneGeometry args={[9, 14, 16]} />
                            <meshLambertMaterial color="#C9A45C" />
                        </mesh>
                        <Bar from={COLLAR_FRONT} to={COLLAR_BACK} radius={6} color="#C9A45C" />
                        <Bar from={COLLAR_BACK} to={WAND_BACK} radius={3.5} color="#c9ccc9" />
                        <Bar from={GRIP_FRONT} to={GRIP_BACK} radius={8} color="#E5A93C" />
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
                // camera ortografica, 1 unitate = 1 pixel: lancea nebulizatorului se pozitioneaza direct in pixeli
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
