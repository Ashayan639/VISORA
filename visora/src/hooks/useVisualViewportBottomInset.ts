"use client";

import { useEffect, useState } from "react";

/**
 * Extra bottom padding (px) when the virtual keyboard shrinks visualViewport,
 * so the chat composer stays above the keyboard on mobile.
 */
export function useVisualViewportBottomInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(Math.max(0, Math.round(gap)));
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
