/*
  Thin top scroll-progress bar. Reads native scroll position (Lenis wraps native
  scroll, so this stays correct with or without smoothing) and scales a fixed bar.
  Informational, not vestibular — runs under reduced-motion too, just without the
  gsap ticker (a passive scroll listener with rAF coalescing).
*/
export function initProgress(): void {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  if (!bar) return;

  let ticking = false;
  const update = (): void => {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  window.addEventListener('resize', update, { passive: true });
  update();
}
