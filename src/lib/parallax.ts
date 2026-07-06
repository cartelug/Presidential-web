import { prefersReducedMotion } from './motion';

/**
 * Lerped parallax for any `[data-speed]` element: it trails the real scroll
 * position instead of tracking it 1:1, eased toward its target each frame at
 * the same lerp constant (0.1) Lenis is configured with in `motion.ts` — so
 * the drift reads as one consistent physical feel across the whole page
 * rather than two competing scroll systems.
 *
 * Native scroll is never touched here; this only ever reads layout via
 * getBoundingClientRect and writes a CSS custom property, so it composes
 * safely with each element's own transform (centering, hover states, etc.)
 * instead of overwriting it.
 */
const LERP = 0.1;

interface ParallaxEl {
  el: HTMLElement;
  speed: number;
  current: number;
  target: number;
}

let started = false;

export function initParallax(root: ParentNode = document): void {
  if (started || prefersReducedMotion()) return;
  started = true;

  const els: ParallaxEl[] = [...root.querySelectorAll<HTMLElement>('[data-speed]')].map((el) => ({
    el,
    speed: parseFloat(el.dataset.speed ?? '0'),
    current: 0,
    target: 0,
  }));
  if (!els.length) return;

  function updateTargets(): void {
    const vh = window.innerHeight;
    for (const p of els) {
      const rootEl = p.el.closest<HTMLElement>('[data-speed-root]') ?? p.el.parentElement ?? p.el;
      const r = rootEl.getBoundingClientRect();
      p.target = -(r.top + r.height / 2 - vh / 2) * p.speed;
    }
  }

  window.addEventListener('scroll', updateTargets, { passive: true });
  window.addEventListener('resize', updateTargets, { passive: true });
  updateTargets();

  function raf(): void {
    for (const p of els) {
      p.current += (p.target - p.current) * LERP;
      p.el.style.setProperty('--py', `${p.current.toFixed(2)}px`);
    }
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}
