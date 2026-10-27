import { Color, Euler, Quaternion, Vector3 } from "three";
import type { BeanPreset } from "./store";

export type Bean = {
  p: Vector3;
  v: Vector3;
  q: Quaternion;
  spin: Vector3;
  sx: number;
  sy: number;
  sz: number;
  color: Color;
};

const BASE: Record<Exclude<BeanPreset, "mixed">, [number, number, number]> = {
  red: [0.62, 0.16, 0.1],
  white: [0.93, 0.9, 0.82],
  pinto: [0.86, 0.72, 0.52],
  black: [0.12, 0.09, 0.08],
};

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function presetColor(preset: BeanPreset, i: number, variation: number): Color {
  const key: Exclude<BeanPreset, "mixed"> =
    preset === "mixed" ? (["red", "white", "pinto", "black"] as const)[i % 4] : preset;
  const [r, g, b] = BASE[key];
  const jitter = (n: number) => (Math.sin(i * 12.9898 + n) * 0.5 + 0.5) * variation;
  const c = new Color(r, g, b);
  c.offsetHSL((jitter(1) - 0.5) * 0.08, (jitter(2) - 0.5) * 0.25, (jitter(3) - 0.5) * 0.28);
  return c;
}

const euler = new Euler();

export function spawnBeans(opts: {
  count: number;
  beanSize: number;
  beanLength: number;
  beanWidth: number;
  beanThick: number;
  variation: number;
  preset: BeanPreset;
  cx: number;
  cy: number;
  cz: number;
  hx: number;
  hy: number;
  hz: number;
}): Bean[] {
  const beans: Bean[] = [];
  for (let i = 0; i < opts.count; i++) {
    const vary = 1 + (hash(i) - 0.5) * 2 * opts.variation;
    const sx = opts.beanSize * opts.beanWidth * vary;
    const sy = opts.beanSize * opts.beanLength * (0.85 + hash(i + 3) * 0.3);
    const sz = opts.beanSize * opts.beanThick * (0.85 + hash(i + 7) * 0.3);
    const rad = Math.max(sx, sy, sz);
    euler.set(hash(i) * Math.PI, hash(i + 1) * Math.PI, hash(i + 2) * Math.PI);
    beans.push({
      p: new Vector3(
        opts.cx + (hash(i + 11) - 0.5) * Math.max(0.02, opts.hx * 2 - rad * 2),
        opts.cy + opts.hy * 0.45 + hash(i + 17) * opts.hy * 0.45,
        opts.cz + (hash(i + 19) - 0.5) * Math.max(0.02, opts.hz * 2 - rad * 2),
      ),
      v: new Vector3((hash(i + 2) - 0.5) * 0.15, -0.35 - hash(i + 5) * 0.4, (hash(i + 8) - 0.5) * 0.15),
      q: new Quaternion().setFromEuler(euler),
      spin: new Vector3((hash(i + 4) - 0.5) * 5, (hash(i + 6) - 0.5) * 5, (hash(i + 9) - 0.5) * 5),
      sx,
      sy,
      sz,
      color: presetColor(opts.preset, i, Math.max(0.12, opts.variation)),
    });
  }
  return beans;
}

const dq = new Quaternion();

export function stepBeans(
  beans: Bean[],
  dt: number,
  box: { cx: number; cy: number; cz: number; hx: number; hy: number; hz: number },
) {
  const d = Math.min(dt, 0.033);
  const g = -3.4;
  const rest = 0.18;
  const friction = 0.82;

  for (const b of beans) {
    b.v.y += g * d;
    b.p.addScaledVector(b.v, d);
    const rad = Math.max(b.sx, b.sy, b.sz) * 0.72;
    const minX = box.cx - box.hx + rad;
    const maxX = box.cx + box.hx - rad;
    const minZ = box.cz - box.hz + rad;
    const maxZ = box.cz + box.hz - rad;
    const minY = box.cy - box.hy + rad;
    const maxY = box.cy + box.hy - rad;

    if (b.p.x < minX) {
      b.p.x = minX;
      b.v.x = Math.abs(b.v.x) * rest;
    } else if (b.p.x > maxX) {
      b.p.x = maxX;
      b.v.x = -Math.abs(b.v.x) * rest;
    }
    if (b.p.z < minZ) {
      b.p.z = minZ;
      b.v.z = Math.abs(b.v.z) * rest;
    } else if (b.p.z > maxZ) {
      b.p.z = maxZ;
      b.v.z = -Math.abs(b.v.z) * rest;
    }
    if (b.p.y < minY) {
      b.p.y = minY;
      b.v.y = Math.abs(b.v.y) * rest;
      b.v.x *= friction;
      b.v.z *= friction;
      b.spin.multiplyScalar(0.9);
    } else if (b.p.y > maxY) {
      b.p.y = maxY;
      b.v.y = -Math.abs(b.v.y) * rest;
    }

    if (b.v.lengthSq() > 0.0008) {
      dq.set(b.spin.x * d, b.spin.y * d, b.spin.z * d, 1).normalize();
      b.q.multiply(dq);
    }
  }

  for (let n = 0; n < 2; n++) {
    for (let i = 0; i < beans.length; i++) {
      const a = beans[i];
      for (let j = i + 1; j < beans.length; j++) {
        const b = beans[j];
        const dx = b.p.x - a.p.x;
        const dy = b.p.y - a.p.y;
        const dz = b.p.z - a.p.z;
        const dist = Math.hypot(dx, dy, dz) || 0.0001;
        const min = (Math.max(a.sx, a.sy, a.sz) + Math.max(b.sx, b.sy, b.sz)) * 0.78;
        if (dist < min) {
          const push = (min - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;
          a.p.x -= nx * push;
          a.p.y -= ny * push;
          a.p.z -= nz * push;
          b.p.x += nx * push;
          b.p.y += ny * push;
          b.p.z += nz * push;
          a.v.x -= nx * 0.15;
          a.v.y -= ny * 0.15;
          a.v.z -= nz * 0.15;
          b.v.x += nx * 0.15;
          b.v.y += ny * 0.15;
          b.v.z += nz * 0.15;
        }
      }
    }
  }
}
