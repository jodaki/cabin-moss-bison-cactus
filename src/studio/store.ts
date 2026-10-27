import { create } from "zustand";

export type LookId = "realistic" | "cinematic" | "catalog" | "macro";
export type WrapMode = "none" | "gloss" | "matte";
export type BeanPreset = "red" | "white" | "pinto" | "black" | "mixed";

export type StudioState = {
  objText: string | null;
  objName: string;
  modelTexUrl: string | null;
  beanTexUrl: string | null;
  glass: boolean;
  glassAmount: number;
  glassRough: number;
  texOffsetX: number;
  texOffsetY: number;
  texRepeat: number;
  modelX: number;
  modelY: number;
  modelZ: number;
  modelScale: number;
  modelRotY: number;
  showSampleJar: boolean;
  boxW: number;
  boxH: number;
  boxD: number;
  boxX: number;
  boxY: number;
  boxZ: number;
  showWalls: boolean;
  count: number;
  beanSize: number;
  beanLength: number;
  beanWidth: number;
  beanThick: number;
  variation: number;
  beanPreset: BeanPreset;
  pourToken: number;
  wrap: WrapMode;
  look: LookId;
  set: (patch: Partial<StudioState>) => void;
  pour: () => void;
};

export const useStudio = create<StudioState>((set) => ({
  objText: null,
  objName: "",
  modelTexUrl: null,
  beanTexUrl: null,
  glass: true,
  glassAmount: 0.92,
  glassRough: 0.04,
  texOffsetX: 0,
  texOffsetY: 0,
  texRepeat: 1,
  modelX: 0,
  modelY: 0.15,
  modelZ: 0,
  modelScale: 1,
  modelRotY: 0,
  showSampleJar: true,
  boxW: 1.15,
  boxH: 1.35,
  boxD: 1.15,
  boxX: 0,
  boxY: 0.72,
  boxZ: 0,
  showWalls: true,
  count: 160,
  beanSize: 0.055,
  beanLength: 1.45,
  beanWidth: 0.82,
  beanThick: 0.7,
  variation: 0.35,
  beanPreset: "red",
  pourToken: 1,
  wrap: "gloss",
  look: "realistic",
  set: (patch) => set(patch),
  pour: () => set((s) => ({ pourToken: s.pourToken + 1 })),
}));

export const LOOKS: Record<
  LookId,
  {
    label: string;
    bg: string;
    fov: number;
    exposure: number;
    key: number;
    fill: number;
    rim: number;
    vignette: number;
    keyColor: string;
  }
> = {
  realistic: {
    label: "محصول واقعی",
    bg: "#cfc6bc",
    fov: 32,
    exposure: 1.05,
    key: 3.4,
    fill: 1.15,
    rim: 0.9,
    vignette: 0.22,
    keyColor: "#fff4e8",
  },
  cinematic: {
    label: "سینمایی",
    bg: "#14110f",
    fov: 26,
    exposure: 0.82,
    key: 5.2,
    fill: 0.28,
    rim: 2.4,
    vignette: 0.58,
    keyColor: "#ffd2a8",
  },
  catalog: {
    label: "کاتالوگ سفید",
    bg: "#f3f1ee",
    fov: 34,
    exposure: 1.18,
    key: 2.5,
    fill: 1.7,
    rim: 0.35,
    vignette: 0.08,
    keyColor: "#ffffff",
  },
  macro: {
    label: "ماکرو",
    bg: "#b7a18c",
    fov: 18,
    exposure: 1.02,
    key: 4.1,
    fill: 0.65,
    rim: 1.6,
    vignette: 0.42,
    keyColor: "#ffe7cc",
  },
};
