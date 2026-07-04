import { gsap, ScrollTrigger, durations, eases, stagger, prefersReducedMotion } from './motion';

/**
 * Progressive-enhancement fade-up for any `[data-reveal-group]` containing
 * `[data-reveal]` children. Content is fully visible in the DOM/CSS by
 * default — this only ever adds motion, never hides content that JS fails
 * to reach (no-JS and reduced-motion users see everything immediately).
 */
export function initReveals(root: ParentNode = document): void {
  if (prefersReducedMotion()) return;

  const groups = root.querySelectorAll<HTMLElement>('[data-reveal-group]');
  groups.forEach((group) => {
    const items = group.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!items.length) return;

    gsap.set(items, { opacity: 0, y: 24 });

    ScrollTrigger.create({
      trigger: group,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: durations.base,
          ease: eases.standard,
          stagger: { each: stagger.max, from: 'start' },
        });
      },
    });
  });
}
