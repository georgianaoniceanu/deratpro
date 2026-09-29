"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

// bula de sapun: margini irizate (efect fresnel) + doua pete de lumina, ca reflexia unei ferestre
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    // camera ortografica: directia privirii e aceeasi pentru toate punctele
    vView = vec3(0.0, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`
const fragmentShader = `
  uniform float uTime;
  uniform float uSeed;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float facing = max(dot(vNormal, vView), 0.0);
    float fres = pow(1.0 - facing, 2.4);

    // culori de pelicula subtire (curcubeu care se misca incet)
    vec3 rainbow = 0.5 + 0.5 * cos(6.2831 * (fres * 1.3 + uTime * 0.06 + uSeed + vec3(0.0, 0.33, 0.67)));
    vec3 cream = vec3(1.0, 0.94, 0.82);
    vec3 col = mix(cream, rainbow, 0.5);

    // reflexia ferestrei (pete albe)
    vec3 L = normalize(vec3(-0.6, 0.7, 1.0));
    float spec = pow(max(dot(reflect(-L, vNormal), vView), 0.0), 80.0);
    float spec2 = pow(max(dot(reflect(-normalize(vec3(0.5, -0.4, 1.0)), vNormal), vView), 0.0), 200.0) * 0.5;

    float alpha = fres * 0.8 + 0.03 + spec + spec2;
    col += spec + spec2;
    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`

type BubbleData = {
    nx: number // pozitia orizontala ca fractiune din latimea ecranului (-0.5 .. 0.5)
    edge: number // pe telefon: -1 = marginea din stanga, 1 = dreapta; 0 = oriunde (desktop)
    y: number | null // null = inca nepozitionata (se calculeaza la primul cadru)
    ny: number // pozitia verticala initiala, ca fractiune din inaltime
    fromBelow: boolean
    z: number
    radius: number
    speed: number
    phase: number
    popping: number // -1 = intreaga, 0..1 = se sparge
}

// o bula noua: fie oriunde pe ecran (la inceput), fie sub marginea de jos.
// pozitiile sunt fractiuni din ecran, ca bulele sa fie distribuite egal indiferent de dimensiune
function createBubble(small: boolean, anywhere: boolean): BubbleData {
    const radius = small ? THREE.MathUtils.randFloat(0.35, 0.8) : THREE.MathUtils.randFloat(0.3, 0.85)
    return {
        nx: THREE.MathUtils.randFloatSpread(0.95),
        edge: 0,
        y: null,
        ny: THREE.MathUtils.randFloatSpread(1),
        fromBelow: !anywhere,
        z: THREE.MathUtils.randFloat(-2, 1.5),
        radius,
        speed: THREE.MathUtils.randFloat(0.28, 0.64),
        phase: Math.random() * Math.PI * 2,
        popping: -1,
    }
}

type Splash = {
    points: THREE.Points
    velocities: THREE.Vector3[]
    life: number
}

function BubbleField({ count, small }: { count: number; small: boolean }) {
    const { camera, viewport, scene } = useThree()
    const meshes = useRef<(THREE.Mesh | null)[]>([])
    const bubbles = useRef<BubbleData[]>([])
    const splashes = useRef<Splash[]>([])
    const view = useRef({ width: viewport.width, height: viewport.height })

    const reduceMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, [])
    const geometry = useMemo(() => new THREE.SphereGeometry(1, 48, 48), [])
    const materials = useMemo(
        () =>
            Array.from({ length: count }, (_, i) =>
                new THREE.ShaderMaterial({
                    vertexShader,
                    fragmentShader,
                    // fiecare bula porneste de la alta culoare a curcubeului
                    uniforms: { uTime: { value: 0 }, uSeed: { value: (i * 0.618) % 1 }, uOpacity: { value: 1 } },
                    transparent: true,
                    depthWrite: false,
                })
            ),
        [count]
    )

    // textura pentru stropi: un cerc estompat, ca punctele sa nu fie patrate
    const dotTexture = useMemo(() => {
        const canvas = document.createElement("canvas")
        canvas.width = canvas.height = 32
        const ctx = canvas.getContext("2d")!
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
        gradient.addColorStop(0, "rgba(255,255,255,1)")
        gradient.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 32, 32)
        return new THREE.CanvasTexture(canvas)
    }, [])

    // stropi care zboara in afara din locul unde s-a spart bula
    const splash = useCallback((center: THREE.Vector3, radius: number) => {
        const n = 14
        const positions = new Float32Array(n * 3)
        const velocities: THREE.Vector3[] = []
        for (let k = 0; k < n; k++) {
            const a = (k / n) * Math.PI * 2 + Math.random() * 0.4
            positions.set([center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius, center.z], k * 3)
            velocities.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0).multiplyScalar(1.2 + Math.random() * 1.2))
        }
        const splashGeometry = new THREE.BufferGeometry()
        splashGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
        const points = new THREE.Points(
            splashGeometry,
            new THREE.PointsMaterial({
                size: 7,
                sizeAttenuation: false,
                map: dotTexture,
                color: "#F5E4BE",
                transparent: true,
                depthWrite: false,
            })
        )
        scene.add(points)
        splashes.current.push({ points, velocities, life: 0 })
    }, [scene, dotTexture])

    useEffect(() => {
        bubbles.current = Array.from({ length: count }, () => createBubble(small, true))
    }, [count, small])

    // spargere la hover (desktop) sau atingere (telefon); canvas-ul nu primeste click-uri,
    // asa ca ascultam pe window si verificam noi ce bula e sub cursor
    useEffect(() => {
        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2()

        function tryPop(e: PointerEvent) {
            // bulele sunt in spatele site-ului: se sparg doar cand cursorul e pe fundal
            if (e.target instanceof Element && e.target.closest("[data-site]")) return
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1
            pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
            raycaster.setFromCamera(pointer, camera)
            const live = meshes.current.filter((m, i): m is THREE.Mesh => !!m && bubbles.current[i]?.popping < 0)
            const hit = raycaster.intersectObjects(live)[0]
            if (!hit) return
            const i = meshes.current.indexOf(hit.object as THREE.Mesh)
            if (i < 0) return
            bubbles.current[i].popping = 0
            splash(hit.object.position.clone(), bubbles.current[i].radius)
        }

        window.addEventListener("pointermove", tryPop)
        window.addEventListener("pointerdown", tryPop)
        return () => {
            window.removeEventListener("pointermove", tryPop)
            window.removeEventListener("pointerdown", tryPop)
        }
    }, [camera, splash])

    useEffect(() => {
        const activeSplashes = splashes.current
        return () => {
            geometry.dispose()
            materials.forEach(m => m.dispose())
            dotTexture.dispose()
            activeSplashes.forEach(s => {
                s.points.geometry.dispose()
                ;(s.points.material as THREE.Material).dispose()
            })
        }
    }, [geometry, materials, dotTexture])

    useFrame((state, delta) => {
        const dt = Math.min(delta, 0.05)
        const speed = reduceMotion ? 0.05 : 1
        const t = state.clock.elapsedTime
        view.current = { width: state.viewport.width, height: state.viewport.height }
        const { width, height } = view.current

        bubbles.current.forEach((b, i) => {
            const mesh = meshes.current[i]
            if (!mesh) return
            const material = materials[i]
            material.uniforms.uTime.value = t

            if (b.popping >= 0) {
                // spargere: se umfla putin si dispare in 0.2s, apoi apare una noua jos
                b.popping += dt / 0.2
                mesh.scale.setScalar(b.radius * (1 + b.popping * 0.35))
                material.uniforms.uOpacity.value = Math.max(0, 1 - b.popping)
                if (b.popping >= 1) {
                    bubbles.current[i] = createBubble(small, false)
                    material.uniforms.uOpacity.value = 1
                }
                return
            }

            if (b.y === null) {
                b.y = b.fromBelow ? -height / 2 - b.radius - Math.random() * 2 : b.ny * height
            }

            // urcare lenta + leganare stanga-dreapta; bulele raman perfect rotunde
            b.y += b.speed * dt * speed
            const sway = Math.sin(t * 0.6 * speed + b.phase)
            // pe telefon: centrul marginii de 40px e la 20px (0.2 unitati) de la marginea ecranului
            const x = b.edge !== 0 ? b.edge * (width / 2 - 0.2) + sway * 0.03 : b.nx * width + sway * 0.32
            mesh.position.set(x, b.y, b.z)
            mesh.scale.setScalar(b.radius)

            if (b.y - b.radius > height / 2) bubbles.current[i] = createBubble(small, false)
        })

        // stropii zboara in afara si se estompeaza in 0.6s
        for (let s = splashes.current.length - 1; s >= 0; s--) {
            const sp = splashes.current[s]
            sp.life += dt / 0.6
            const pos = sp.points.geometry.attributes.position as THREE.BufferAttribute
            for (let k = 0; k < sp.velocities.length; k++) {
                pos.array[k * 3] += sp.velocities[k].x * dt
                pos.array[k * 3 + 1] += sp.velocities[k].y * dt
            }
            pos.needsUpdate = true
            ;(sp.points.material as THREE.PointsMaterial).opacity = 1 - sp.life
            if (sp.life >= 1) {
                scene.remove(sp.points)
                sp.points.geometry.dispose()
                ;(sp.points.material as THREE.Material).dispose()
                splashes.current.splice(s, 1)
            }
        }
    })

    return (
        <>
            {materials.map((material, i) => (
                <mesh
                    key={i}
                    ref={el => {
                        meshes.current[i] = el
                    }}
                    geometry={geometry}
                    material={material}
                    scale={0}
                />
            ))}
        </>
    )
}

export default function BubblesScene() {
    // mai putine si mai mici pe telefon
    const small = useMemo(() => window.innerWidth < 768, [])
    const count = small ? 28 : 50

    return (
        <Canvas
            dpr={[1, 2]}
            // camera ortografica: fara perspectiva, deci bulele raman rotunde si la marginile ecranului
            orthographic
            camera={{ position: [0, 0, 10], zoom: 100 }}
            gl={{ alpha: true, antialias: true }}
            style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
            aria-hidden="true"
        >
            <BubbleField count={count} small={small} />
        </Canvas>
    )
}
