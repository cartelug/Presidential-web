import {
  gsap,
  ScrollTrigger,
  SplitText,
  durations,
  eases,
  stagger,
  prefersReducedMotion,
} from './motion';

/**
 * Reversible, mask-based reveals for any `[data-reveal-group]` containing
 * `[data-reveal]` children. Headings unmask line-by-line (SplitText line masks);
 * other items rise behind a clip-path mask. Unlike the previous single
 * `once:true` fade-up, reveals now REVERSE on scroll-back (toggleActions), so
 * scrolling up is no longer dead, and stagger flows from a chosen origin.
 *
 * Content is fully visible in the DOM/CSS by default — this only ever adds
 * motion. No-JS and reduced-motion users see everything immediately.
 */
export function initReveals(root: ParentNode = document): void {
  if (prefersReducedMotion()) return;

  const groups = root.querySelectorAll<HTMLElement>('[data-reveal-group]');
  groups.forEach((group) => {
    const items = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!items.length) return;

    // Directional origin: achievement bands alternate align-left/right, so
    // their reveals flow from the matching edge; everything else from start.
    const from: 'start' | 'end' | 'center' = group.classList.contains('align-right')
      ? 'end'
      : group.classList.contains('align-left')
        ? 'start'
        : 'center';

    const headings: HTMLElement[] = [];
    const blocks: HTMLElement[] = [];
    for (const el of items) {
      (/^H[1-3]$/.test(el.tagName) ? headings : blocks).push(el);
    }

    // Set initial hidden state (JS-only; DOM stays visible if this never runs).
    gsap.set(blocks, { opacity: 0, y: 28, clipPath: 'inset(0 0 100% 0)' });

    const splits = headings.map((h) => {
      const s = new SplitText(h, { type: 'lines', mask: 'lines', linesClass: 'reveal-line' });
      gsap.set(s.lines, { yPercent: 110 });
      return s;
    });

    ScrollTrigger.create({
      trigger: group,
      start: 'top 82%',
      // Reversible: play on enter, reverse on leave-back.
      toggleActions: 'play none none reverse',
      onEnter: () => runIn(),
      onEnterBack: () => runIn(),
      onLeaveBack: () => runOut(),
    });

    function runIn(): void {
      splits.forEach((s) => {
        gsap.to(s.lines, {
          yPercent: 0,
          duration: durations.slow,
          ease: eases.entrance,
          stagger: { each: stagger.max, from },
        });
      });
      gsap.to(blocks, {
        opacity: 1,
        y: 0,
        clipPath: 'inset(0 0 0% 0)',
        duration: durations.base,
        ease: eases.standard,
        stagger: { each: stagger.max, from },
        delay: headings.length ? 0.12 : 0,
      });
    }

    function runOut(): void {
      splits.forEach((s) => gsap.to(s.lines, { yPercent: 110, duration: durations.fast, ease: eases.exit }));
      gsap.to(blocks, {
        opacity: 0,
        y: 28,
        clipPath: 'inset(0 0 100% 0)',
        duration: durations.fast,
        ease: eases.exit,
      });
    }
  });
}
