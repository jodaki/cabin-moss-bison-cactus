import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Box3,
  CanvasTexture,
  Color,
  DoubleSide,
  InstancedMesh,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  Texture,
  TextureLoader,
  Vector3,
} from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { stepBeans, spawnBeans, type Bean } from "./beans";
import { LOOKS, useStudio } from "./store";

function paintBeans(preset: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  if (!g) return c;
  const bases: Record<string, string> = {
    red: "#8d2d22",
    white: "#f4efe4",
    pinto: "#e4c89a",
    black: "#2a211c",
    mixed: "#a33b2b",
  };
  g.fillStyle = bases[preset] ?? bases.red;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const rad = Math.random() * 7 + 1;
    g.fillStyle = `rgba(${40 + Math.random() * 180},${20 + Math.random() * 80},${10 + Math.random() * 40},${0.15 + Math.random() * 0.45})`;
    g.beginPath();
    g.ellipse(x, y, rad, rad * 0.55, Math.random() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  if (preset === "pinto" || preset === "mixed") {
    g.strokeStyle = "rgba(90,40,20,0.55)";
    g.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      g.beginPath();
      g.moveTo(Math.random() * 256, Math.random() * 256);
      g.bezierCurveTo(
        Math.random() * 256,
        Math.random() * 256,
        Math.random() * 256,
        Math.random() * 256,
        Math.random() * 256,
        Math.random() * 256,
      );
      g.stroke();
    }
  }
  const shine = g.createLinearGradient(0, 0, 256, 180);
  shine.addColorStop(0, "rgba(255,255,255,0.28)");
  shine.addColorStop(0.45, "rgba(255,255,255,0)");
  g.fillStyle = shine;
  g.fillRect(0, 0, 256, 256);
  return c;
}

function useImageTexture(url: string | null) {
  const tex = useMemo(() => {
    if (!url) return null;
    const t = new TextureLoader().load(url);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    return t;
  }, [url]);
  useEffect(() => {
    return () => {
      tex?.dispose();
    };
  }, [tex]);
  return tex;
}

function applyMap(material: MeshPhysicalMaterial, map: Texture | null, ox: number, oy: number, repeat: number) {
  material.map = map;
  if (map) {
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.offset.set(ox, oy);
    map.repeat.set(repeat, repeat);
    map.needsUpdate = true;
  }
  material.needsUpdate = true;
}

function ShellMaterial(glass: boolean, amount: number, rough: number) {
  return new MeshPhysicalMaterial({
    color: glass ? "#f7fbff" : "#f4f1ec",
    metalness: 0,
    roughness: glass ? rough : 0.45,
    transmission: glass ? amount : 0,
    thickness: glass ? 0.35 : 0,
    ior: 1.45,
    transparent: glass,
    opacity: glass ? 1 : 1,
    clearcoat: glass ? 1 : 0.15,
    clearcoatRoughness: rough,
    side: DoubleSide,
  });
}

function SampleJar() {
  const glass = useStudio((s) => s.glass);
  const amount = useStudio((s) => s.glassAmount);
  const rough = useStudio((s) => s.glassRough);
  const show = useStudio((s) => s.showSampleJar);
  const ox = useStudio((s) => s.texOffsetX);
  const oy = useStudio((s) => s.texOffsetY);
  const repeat = useStudio((s) => s.texRepeat);
  const map = useImageTexture(useStudio((s) => s.modelTexUrl));
  const mat = useMemo(() => ShellMaterial(glass, amount, rough), [glass, amount, rough]);
  useLayoutEffect(() => {
    applyMap(mat, glass ? null : map, ox, oy, repeat);
    mat.color.set(glass ? "#f4fbff" : "#f7f4ef");
    mat.transmission = glass ? amount : 0;
    mat.roughness = glass ? rough : 0.42;
    mat.thickness = glass ? 0.4 : 0;
    mat.transparent = glass;
    mat.clearcoat = glass ? 1 : 0.1;
  }, [mat, glass, amount, rough, map, ox, oy, repeat]);
  if (!show) return null;
  return (
    <mesh position={[0, 0.85, 0]} castShadow>
      <cylinderGeometry args={[0.72, 0.68, 1.7, 48, 1, true]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function ObjModel() {
  const text = useStudio((s) => s.objText);
  const glass = useStudio((s) => s.glass);
  const amount = useStudio((s) => s.glassAmount);
  const rough = useStudio((s) => s.glassRough);
  const ox = useStudio((s) => s.texOffsetX);
  const oy = useStudio((s) => s.texOffsetY);
  const repeat = useStudio((s) => s.texRepeat);
  const px = useStudio((s) => s.modelX);
  const py = useStudio((s) => s.modelY);
  const pz = useStudio((s) => s.modelZ);
  const scale = useStudio((s) => s.modelScale);
  const rot = useStudio((s) => s.modelRotY);
  const map = useImageTexture(useStudio((s) => s.modelTexUrl));

  const object = useMemo(() => {
    if (!text) return null;
    const root = new OBJLoader().parse(text);
    root.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.material = ShellMaterial(true, 0.9, 0.05);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    const box = new Box3().setFromObject(root);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    root.position.sub(center);
    const max = Math.max(size.x, size.y, size.z) || 1;
    root.scale.setScalar(2.1 / max);
    return root;
  }, [text]);

  useLayoutEffect(() => {
    if (!object) return;
    object.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as MeshPhysicalMaterial;
      mat.transmission = glass ? amount : 0;
      mat.roughness = glass ? rough : 0.4;
      mat.thickness = glass ? 0.45 : 0;
      mat.transparent = glass;
      mat.clearcoat = glass ? 1 : 0.12;
      mat.clearcoatRoughness = rough;
      mat.color.set(glass ? "#f3f8ff" : "#ffffff");
      applyMap(mat, glass ? null : map, ox, oy, repeat);
    });
  }, [object, glass, amount, rough, map, ox, oy, repeat]);

  if (!object) return null;
  return (
    <group position={[px, py, pz]} rotation={[0, rot, 0]} scale={scale}>
      <primitive object={object} />
    </group>
  );
}

function Beans() {
  const mesh = useRef<InstancedMesh>(null);
  const beans = useRef<Bean[]>([]);
  const dummy = useMemo(() => new Object3D(), []);
  const count = useStudio((s) => s.count);
  const beanSize = useStudio((s) => s.beanSize);
  const beanLength = useStudio((s) => s.beanLength);
  const beanWidth = useStudio((s) => s.beanWidth);
  const beanThick = useStudio((s) => s.beanThick);
  const variation = useStudio((s) => s.variation);
  const preset = useStudio((s) => s.beanPreset);
  const pourToken = useStudio((s) => s.pourToken);
  const boxW = useStudio((s) => s.boxW);
  const boxH = useStudio((s) => s.boxH);
  const boxD = useStudio((s) => s.boxD);
  const boxX = useStudio((s) => s.boxX);
  const boxY = useStudio((s) => s.boxY);
  const boxZ = useStudio((s) => s.boxZ);
  const beanTexUrl = useStudio((s) => s.beanTexUrl);

  const proc = useMemo(() => {
    const t = new CanvasTexture(paintBeans(preset));
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [preset]);
  const uploaded = useImageTexture(beanTexUrl);
  const map = uploaded ?? proc;

  const geo = useMemo(() => new SphereGeometry(1, 14, 10), []);
  const mat = useMemo(() => new MeshStandardMaterial({ roughness: 0.42, metalness: 0.04 }), []);
  useLayoutEffect(() => {
    mat.map = map;
    mat.needsUpdate = true;
  }, [mat, map]);

  useEffect(() => {
    return () => proc.dispose();
  }, [proc]);

  useLayoutEffect(() => {
    beans.current = spawnBeans({
      count,
      beanSize,
      beanLength,
      beanWidth,
      beanThick,
      variation,
      preset,
      cx: boxX,
      cy: boxY,
      cz: boxZ,
      hx: boxW / 2,
      hy: boxH / 2,
      hz: boxD / 2,
    });
  }, [count, beanSize, beanLength, beanWidth, beanThick, variation, preset, pourToken, boxX, boxY, boxZ, boxW, boxH, boxD]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    stepBeans(beans.current, dt, {
      cx: boxX,
      cy: boxY,
      cz: boxZ,
      hx: boxW / 2,
      hy: boxH / 2,
      hz: boxD / 2,
    });
    const list = beans.current;
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      dummy.position.copy(b.p);
      dummy.quaternion.copy(b.q);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, b.color);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geo, mat, count]} castShadow receiveShadow />
  );
}

function Containment() {
  const w = useStudio((s) => s.boxW);
  const h = useStudio((s) => s.boxH);
  const d = useStudio((s) => s.boxD);
  const x = useStudio((s) => s.boxX);
  const y = useStudio((s) => s.boxY);
  const z = useStudio((s) => s.boxZ);
  const show = useStudio((s) => s.showWalls);
  const wrap = useStudio((s) => s.wrap);
  if (!show && wrap === "none") return null;
  const gloss = wrap === "gloss";
  return (
    <group position={[x, y, z]}>
      {show && (
        <mesh>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial color="#f3e6d0" wireframe transparent opacity={0.35} />
        </mesh>
      )}
      {wrap !== "none" && (
        <mesh>
          <boxGeometry args={[w + 0.03, h + 0.03, d + 0.03]} />
          <meshPhysicalMaterial
            color={gloss ? "#fffaf2" : "#efeae2"}
            transmission={gloss ? 0.86 : 0.45}
            roughness={gloss ? 0.04 : 0.72}
            thickness={0.12}
            transparent
            opacity={gloss ? 0.55 : 0.72}
            clearcoat={gloss ? 1 : 0}
            clearcoatRoughness={gloss ? 0.05 : 0.8}
            side={DoubleSide}
            metalness={0}
            ior={1.4}
          />
        </mesh>
      )}
    </group>
  );
}

function LookSync() {
  const look = useStudio((s) => s.look);
  const { gl, camera } = useThree();
  useLayoutEffect(() => {
    const preset = LOOKS[look];
    gl.toneMappingExposure = preset.exposure;
    gl.setClearColor(new Color(preset.bg));
    if ("fov" in camera) {
      camera.fov = preset.fov;
      camera.updateProjectionMatrix();
    }
  }, [look, gl, camera]);
  const preset = LOOKS[look];
  return (
    <>
      <color attach="background" args={[preset.bg]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[3.2, 5.5, 2.4]}
        intensity={preset.key}
        color={preset.keyColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3.2, 2.2, -1.5]} intensity={preset.fill} color="#d7e4ff" />
      <directionalLight position={[0.2, 2.4, -4]} intensity={preset.rim} color="#ffe1c4" />
    </>
  );
}

export function Scene() {
  const look = useStudio((s) => s.look);
  const shot = () => {
    const canvas = document.querySelector(".stage canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `lobia-${look}.png`;
    a.click();
  };
  return (
    <>
      <Canvas
        shadows
        camera={{ position: [2.4, 1.7, 2.6], fov: LOOKS[look].fov }}
        gl={{ antialias: true, preserveDrawingBuffer: true, alpha: false }}
        dpr={[1, 1.75]}
      >
        <LookSync />
        <SampleJar />
        <ObjModel />
        <Containment />
        <Beans />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <circleGeometry args={[8, 48]} />
          <meshStandardMaterial color={LOOKS[look].bg} roughness={0.95} />
        </mesh>
        <OrbitControls target={[0, 0.7, 0]} maxPolarAngle={Math.PI * 0.49} />
      </Canvas>
      <div className="vignette" style={{ ["--v" as string]: LOOKS[look].vignette }} />
      <button className="shot" type="button" onClick={shot}>
        عکس محصول
      </button>
    </>
  );
}
