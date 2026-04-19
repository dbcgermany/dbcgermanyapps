"use client";

/* -----------------------------------------------------------------------
 * Motion — SSOT for the entire monorepo.
 *
 * Both primitives live here on purpose. Keyframes + tokens live in
 * packages/ui/tokens/base.css. Retune the feel via --dbc-duration-reveal
 * and --dbc-easing-reveal. Do NOT introduce a motion library elsewhere.
 * ----------------------------------------------------------------------- */

import * as React from "react";

/* =========  Reveal — scroll-triggered fade / slide / scale  ========= */

export type RevealVariant = "fade-up" | "fade-in" | "scale-in";

export interface RevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  /** Delay before the keyframe starts, in ms. Use for staggered grids. */
  delay?: number;
  /** If true (default), the animation runs once and the observer disconnects. */
  once?: boolean;
  /** Element tag to render. Keeps grid slots / list semantics intact. */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  once = true,
  as: Tag = "div",
  className,
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    // Reduced-motion: skip the observer entirely and render visible immediately.
    // The global @media rule in base.css additionally zeroes animation-duration.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return React.createElement(
    Tag,
    {
      ref,
      "data-reveal": variant,
      "data-visible": visible ? "true" : "false",
      style: delay ? { animationDelay: `${delay}ms` } : undefined,
      className,
    },
    children
  );
}

/* =========  PageTransition — route-change fade on mount  ========= */

export interface PageTransitionProps {
  children: React.ReactNode;
  /** Pass true to render children without any animation wrapper. */
  disabled?: boolean;
}

export function PageTransition({ children, disabled }: PageTransitionProps) {
  if (disabled) return <>{children}</>;
  return <div className="dbc-page-enter">{children}</div>;
}
