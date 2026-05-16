"use client";

import { Center, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";

import type { LightingPreset } from "./ModelViewer";

/* ─────────────────────────────────────────────────────────────
   Map our friendly preset names → drei's built-in HDRI presets.
   ───────────────────────────────────────────────────────────── */

const PRESET_MAP: Record<LightingPreset, "studio" | "city" | "sunset"> = {
  studio: "studio",
  outdoor: "city",
  dramatic: "sunset",
};

/* ─────────────────────────────────────────────────────────────
   GLB primitive — uses drei's `useGLTF` (Suspense + cache).
   ───────────────────────────────────────────────────────────── */

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  // Free GPU memory when the URL changes / component unmounts.
  useEffect(() => {
    return () => {
      try {
        useGLTF.clear(url);
      } catch {
        /* ignore */
      }
    };
  }, [url]);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

/* ─────────────────────────────────────────────────────────────
   Scene
   ───────────────────────────────────────────────────────────── */

interface ModelSceneProps {
  url: string;
  preset: LightingPreset;
  autoRotate: boolean;
}

export function ModelScene({ url, preset, autoRotate }: ModelSceneProps) {
  return (
    <Canvas
      camera={{ position: [2.5, 2.5, 2.5], fov: 45 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Subtle ambient + a key light so even matte materials register
          before the HDRI loads in. */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />

      <Suspense fallback={null}>
        <GLBModel url={url} />
        <Environment preset={PRESET_MAP[preset]} />
      </Suspense>

      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        enableDamping
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={20}
      />
    </Canvas>
  );
}

export default ModelScene;
