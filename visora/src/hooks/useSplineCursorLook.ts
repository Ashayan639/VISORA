"use client";

import type { Application, SPEObject } from "@splinetool/runtime";
import { useEffect, useRef } from "react";

const HEAD_NAME_PATTERNS = [
  /head/i,
  /face/i,
  /neck/i,
  /skull/i,
  /look/i,
  /eye/i,
];

const ROBOT_FALLBACK_PATTERNS = [/robot/i, /character/i, /bot/i, /android/i, /visora/i];

const MAX_YAW = 0.55;
const MAX_PITCH = 0.35;
const SMOOTHING = 0.09;

interface TrackedPart {
  object: SPEObject;
  baseX: number;
  baseY: number;
  baseZ: number;
}

function findLookTargets(app: Application): TrackedPart[] {
  const all = app.getAllObjects().filter((o) => o.visible);

  const headLike = all.filter((o) =>
    HEAD_NAME_PATTERNS.some((pattern) => pattern.test(o.name)),
  );

  const targets = headLike.length > 0 ? headLike : all.filter((o) =>
    ROBOT_FALLBACK_PATTERNS.some((pattern) => pattern.test(o.name)),
  );

  if (targets.length === 0 && all.length > 0) {
    const byName = [...all].sort((a, b) => a.name.localeCompare(b.name));
    return [byName[0]].map(track);
  }

  return targets.map(track);
}

function track(object: SPEObject): TrackedPart {
  return {
    object,
    baseX: object.rotation.x,
    baseY: object.rotation.y,
    baseZ: object.rotation.z,
  };
}

function normalizePointer(clientX: number, clientY: number) {
  const x = (clientX / window.innerWidth) * 2 - 1;
  const y = (clientY / window.innerHeight) * 2 - 1;
  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
  };
}

/**
 * Smooth head / body look-at driven by cursor position.
 * Works with Spline object rotation and common scene variables.
 */
export function useSplineCursorLook(
  app: Application | null,
  enabled: boolean,
) {
  const partsRef = useRef<TrackedPart[]>([]);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !app) return;

    const prefersFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!prefersFinePointer) return;

    partsRef.current = findLookTargets(app);

    const onPointerMove = (event: PointerEvent) => {
      const { x, y } = normalizePointer(event.clientX, event.clientY);
      targetRef.current = { x, y };

      try {
        app.setVariables({
          mouseX: x,
          mouseY: y,
          "Mouse X": x,
          "Mouse Y": y,
          lookX: x,
          lookY: y,
          "Look X": x,
          "Look Y": y,
          cursorX: x,
          cursorY: y,
        });
      } catch {
        // Scene may not define these variables — rotation fallback still runs.
      }
    };

    const tick = () => {
      const target = targetRef.current;
      const current = currentRef.current;

      current.x += (target.x - current.x) * SMOOTHING;
      current.y += (target.y - current.y) * SMOOTHING;

      const yaw = current.x * MAX_YAW;
      const pitch = current.y * MAX_PITCH;

      for (const part of partsRef.current) {
        part.object.rotation.y = part.baseY + yaw;
        part.object.rotation.x = part.baseX - pitch;
        part.object.rotation.z = part.baseZ;
      }

      app.requestRender();
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [app, enabled]);
}
