import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

let lenis: Lenis | null = null;
let started = false;
let pluginsRegistered = false;

/**
 * Every island bundle imports this module independently (Astro gives each
 * client:* component its own chunk), so plugin registration must be
 * idempotent — calling gsap.registerPlugin from two chunks racing on
 * first paint intermittently threw inside GSAP's internal registry.
 */
function registerPlugins(): void {
  if (pluginsRegistered) return;
  pluginsRegistered = true;
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

registerPlugins();

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Motion tokens (§3.6), mirrored here in JS units for GSAP. */
export const durations = {
  instant: 0.12,
  fast: 0.24,
  base: 0.4,
  slow: 0.7,
  cinematic: 1.1,
};

export const eases = {
  entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
  standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
  scrub: 'none',
};

/**
 * Lenis's own default easing (exponential decay), not an approximation —
 * matches the exact curve `new Lenis({ lerp: 0.1 })` above resolves to for
 * its scroll deceleration. GSAP accepts a plain (t) => t function as an
 * `ease`, so this drops straight into any gsap.to() ease slot.
 */
export function lenisEase(t: number): number {
  return t >= 1 ? 1 : 1.001 - Math.pow(2, -10 * t);
}

export const stagger = { min: 0.06, max: 0.09 };

/**
 * Boots Lenis + ScrollTrigger once per page. Reduced-motion users get plain
 * native scroll — no smoothing, no scrub, per §9 guardrails.
 */
export function initMotion(): { lenis: Lenis | null } {
  if (started) return { lenis };
  started = true;

  if (prefersReducedMotion()) {
    return { lenis: null };
  }

  lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false, // never fight native touch scrolling on mobile
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.matchMedia({
    '(max-width: 767px)': () => {
      ScrollTrigger.config({ ignoreMobileResize: true });
    },
  });

  return { lenis };
}

export function getLenis(): Lenis | null {
  return lenis;
}

export { gsap, ScrollTrigger, SplitText };
