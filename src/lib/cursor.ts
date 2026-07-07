/*
  Custom cursor + magnetic interactions. A gold ring lerps toward the pointer
  (blend-mode difference so it reads on any tone), swells over interactive
  elements and shows a contextual label ("View", "Play", "Open"). Magnetic
  targets lean toward the cursor via a spring.

  Runs on the shared gsap.ticker. Gated behind pointer:fine AND !reduced-motion
  — touch and reduced-motion users get the normal system cursor, untouched.
*/
import { gsap, prefersReducedMotion } from './motion';

export function initCursor(): void {
  if (typeof window === 'undefined') return;
  if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
  if (document.querySelector('[data-cursor]')) return;

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('data-cursor', '');
  ring.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'cursor-ring__label';
  ring.appendChild(label);

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');

  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.body.classList.add('has-custom-cursor');

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx, ry = my; // ring position (lerped)

  window.addEventListener(
    'pointermove',
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      // dot is instant (crisp), ring trails
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    },
    { passive: true }
  );

  window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
  window.addEventListener('pointerup', () => ring.classList.remove('is-down'));
  document.addEventListener('mouseleave', () => {
    ring.style.opacity = '0';
    dot.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    ring.style.opacity = '';
    dot.style.opacity = '';
  });

  gsap.ticker.add(() => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx.toFixed(2)}px, ${ry.toFixed(2)}px)`;
  });

  // Hover state + contextual label over interactive elements.
  const hoverSel = 'a, button, [data-cursor-label], .ledger-figure, [role="button"]';
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as Element)?.closest?.(hoverSel) as HTMLElement | null;
    if (!t) return;
    ring.classList.add('is-hover');
    const txt = t.getAttribute('data-cursor-label') || '';
    label.textContent = txt;
    ring.classList.toggle('has-label', Boolean(txt));
  });
  document.addEventListener('pointerout', (e) => {
    const t = (e.target as Element)?.closest?.(hoverSel);
    if (!t) return;
    ring.classList.remove('is-hover', 'has-label');
    label.textContent = '';
  });

  // Magnetic pull on tagged elements (spring toward cursor, snap back).
  const magnets = document.querySelectorAll<HTMLElement>('[data-magnetic]');
  magnets.forEach((el) => {
    const state = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    const strength = parseFloat(el.dataset.magnetic || '0.3') || 0.3;

    el.addEventListener('pointerenter', () => (state.active = true));
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      state.tx = (e.clientX - (r.left + r.width / 2)) * strength;
      state.ty = (e.clientY - (r.top + r.height / 2)) * strength;
    });
    el.addEventListener('pointerleave', () => {
      state.active = false;
      state.tx = 0;
      state.ty = 0;
    });

    gsap.ticker.add(() => {
      state.x += (state.tx - state.x) * 0.2;
      state.y += (state.ty - state.y) * 0.2;
      if (Math.abs(state.x) < 0.01 && Math.abs(state.y) < 0.01 && !state.active) {
        el.style.transform = '';
        return;
      }
      el.style.transform = `translate(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px)`;
    });
  });
}
